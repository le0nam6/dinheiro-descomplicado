#!/usr/bin/env python3
"""
Ingestion pipeline: chunka análise editorial → embeddings Voyage AI → Supabase pgvector
Usage: python ingest.py <arquivo_de_analise.md>

Deduplicação: upsert via (source, content_hash). Re-rodar o script nunca gera duplicatas.
"""
import hashlib
import json
import os
import re
import sys
import time
import urllib.request
from datetime import date

VOYAGE_API_KEY = os.environ["VOYAGE_API_KEY"]
SUPABASE_URL   = os.environ["SUPABASE_URL"]
SUPABASE_KEY   = os.environ["SUPABASE_SERVICE_KEY"]

CATEGORY_PATTERNS = {
    "titulo":    r"(?i)(título|titulos|padrão de título|title)",
    "abertura":  r"(?i)(abertura|frase filosófica|início|opening)",
    "zoom-out":  r"(?i)(zoom.?out|bottom.?line|marcador)",
    "estrutura": r"(?i)(estrutura|seção|seções|ordem|formato)",
    "tom":       r"(?i)(tom|voz|linguagem|humor|estilo)",
    "collab":    r"(?i)(collab|publicidade|patrocínio|nativo|sponsor)",
    "exemplo":   r"(?i)(exemplo|trecho|literal|original)",
}

def detect_category(text: str) -> str:
    for cat, pattern in CATEGORY_PATTERNS.items():
        if re.search(pattern, text):
            return cat
    return "geral"

def detect_source(text: str) -> str:
    if "tns-money" in text.lower() or "tns money" in text.lower() or "money.thenews" in text.lower():
        return "tns-money"
    if "night" in text.lower() or "noturna" in text.lower():
        return "the-news-night"
    return "the-news-geral"

def content_hash(text: str) -> str:
    return hashlib.md5(text.encode()).hexdigest()

def chunk_markdown(content: str) -> list[dict]:
    """Divide o markdown em chunks semânticos por seção/parágrafo."""
    chunks = []
    current_section = ""

    lines = content.split("\n")
    buffer = []

    def flush(buf: list[str], section: str):
        text = "\n".join(buf).strip()
        if len(text) > 50:
            chunks.append({
                "content":      text,
                "content_hash": content_hash(text),
                "section":      section,
                "source":       detect_source(section + " " + text),
                "category":     detect_category(section + " " + text),
            })

    for line in lines:
        if line.startswith("## ") or line.startswith("### "):
            if buffer:
                flush(buffer, current_section)
                buffer = []
            current_section = line.lstrip("#").strip()
        elif line.startswith("- ") or line.startswith("* "):
            item = line.lstrip("-* ").strip()
            if len(item) > 30:
                chunks.append({
                    "content":      item,
                    "content_hash": content_hash(item),
                    "section":      current_section,
                    "source":       detect_source(current_section + " " + item),
                    "category":     detect_category(current_section + " " + item),
                })
        elif line.strip():
            buffer.append(line)
        else:
            if buffer:
                flush(buffer, current_section)
                buffer = []

    if buffer:
        flush(buffer, current_section)

    return chunks

def embed(texts: list[str], retries: int = 3) -> list[list[float]]:
    """Gera embeddings via Voyage AI com retry em 429."""
    payload = json.dumps({
        "model": "voyage-3-lite",
        "input": texts,
    }).encode()
    for attempt in range(retries):
        req = urllib.request.Request(
            "https://api.voyageai.com/v1/embeddings",
            data=payload,
            headers={
                "Authorization": f"Bearer {VOYAGE_API_KEY}",
                "Content-Type": "application/json",
            },
        )
        try:
            with urllib.request.urlopen(req) as r:
                result = json.load(r)
            return [item["embedding"] for item in result["data"]]
        except urllib.error.HTTPError as e:
            if e.code == 429 and attempt < retries - 1:
                wait = 2 ** (attempt + 1)
                print(f"⏳ Rate limit (429), aguardando {wait}s...")
                time.sleep(wait)
            else:
                raise

def fetch_existing_hashes(sources: list[str]) -> set[str]:
    """Retorna os content_hashes já no Supabase para as fontes dadas."""
    sources_filter = ",".join(f'"{s}"' for s in sources)
    url = (
        f"{SUPABASE_URL}/rest/v1/editorial_knowledge"
        f"?select=content_hash&source=in.({','.join(sources)})"
    )
    req = urllib.request.Request(
        url,
        headers={
            "apikey":        SUPABASE_KEY,
            "Authorization": f"Bearer {SUPABASE_KEY}",
        },
    )
    with urllib.request.urlopen(req) as r:
        rows = json.load(r)
    return {row["content_hash"] for row in rows}


def upsert_to_supabase(records: list[dict]):
    """
    Upsert no Supabase usando (source, content_hash) como chave natural.
    Registros com mesmo conteúdo nunca são duplicados; conteúdo alterado
    atualiza o embedding e os metadados.
    """
    payload = json.dumps(records).encode()
    url = f"{SUPABASE_URL}/rest/v1/editorial_knowledge?on_conflict=source,content_hash"
    req = urllib.request.Request(
        url,
        data=payload,
        headers={
            "apikey":          SUPABASE_KEY,
            "Authorization":   f"Bearer {SUPABASE_KEY}",
            "Content-Type":    "application/json",
            "Prefer":          "resolution=merge-duplicates,return=minimal",
        },
        method="POST",
    )
    try:
        with urllib.request.urlopen(req) as r:
            return r.status
    except urllib.error.HTTPError as e:
        body = e.read().decode()
        raise RuntimeError(f"Supabase {e.code}: {body}") from e

def main():
    file_path = sys.argv[1] if len(sys.argv) > 1 else "reference-the-news.md"

    with open(file_path, "r", encoding="utf-8") as f:
        content = f.read()

    print(f"📖 Lendo {file_path}...")
    chunks = chunk_markdown(content)
    print(f"✂️  {len(chunks)} chunks extraídos")

    sources = list({c["source"] for c in chunks})
    existing_hashes = fetch_existing_hashes(sources)
    new_chunks = [c for c in chunks if c["content_hash"] not in existing_hashes]
    skipped = len(chunks) - len(new_chunks)
    print(f"⏭️  {skipped} chunks já existem no Supabase — gerando embeddings apenas para {len(new_chunks)} novos")

    if not new_chunks:
        print("✅ Nada a fazer — RAG já está atualizado.")
        return

    batch_size = 20
    today = date.today().isoformat()
    upserted = 0

    for i in range(0, len(new_chunks), batch_size):
        batch = new_chunks[i:i + batch_size]
        texts = [c["content"] for c in batch]

        print(f"🔢 Gerando embeddings para batch {i // batch_size + 1}...")
        embeddings = embed(texts)

        records = [
            {
                "source":        c["source"],
                "category":      c["category"],
                "content":       c["content"],
                "content_hash":  c["content_hash"],
                "metadata":      {"section": c["section"]},
                "edition_date":  today,
                "embedding":     "[" + ",".join(str(x) for x in emb) + "]",
            }
            for c, emb in zip(batch, embeddings)
        ]

        status = upsert_to_supabase(records)
        upserted += len(records)
        print(f"✅ Batch upserted (HTTP {status}) — {upserted} total")
        if i + batch_size < len(new_chunks):
            time.sleep(1)

    print(f"\n🎉 Ingestão concluída: {upserted} novos registros no Supabase")

if __name__ == "__main__":
    main()
