#!/usr/bin/env python3
"""
Indexa todos os posts publicados do blog no RAG (Supabase pgvector).
Permite busca semântica de tópicos já cobertos durante a geração de novos posts.

Usage:
  python index-posts.py           # indexa/atualiza todos os posts
  python index-posts.py --dry-run # mostra o que seria indexado sem salvar

Deduplicação via (source, content_hash) — re-rodar é seguro, nunca duplica.
"""

import hashlib
import json
import os
import sys
import time
import urllib.request
import urllib.parse
from datetime import datetime

VOYAGE_API_KEY  = os.environ["VOYAGE_API_KEY"]
SUPABASE_URL    = os.environ["SUPABASE_URL"]
SUPABASE_KEY    = os.environ["SUPABASE_SERVICE_KEY"]
SANITY_PROJECT  = os.environ.get("NEXT_PUBLIC_SANITY_PROJECT_ID", "udz5hvk3")
SANITY_DATASET  = os.environ.get("NEXT_PUBLIC_SANITY_DATASET", "production")
SANITY_TOKEN    = os.environ["SANITY_API_TOKEN"]

DRY_RUN = "--dry-run" in sys.argv

BATCH_SIZE = 64    # Voyage AI batch limit (menor para evitar 429)
RATE_SLEEP = 2.0   # segundos entre batches


def sanity_fetch(query: str) -> list:
    encoded = urllib.parse.quote(query)
    url = f"https://{SANITY_PROJECT}.api.sanity.io/v2024-01-01/data/query/{SANITY_DATASET}?query={encoded}"
    req = urllib.request.Request(url, headers={
        "Authorization": f"Bearer {SANITY_TOKEN}",
    })
    with urllib.request.urlopen(req, timeout=30) as r:
        return json.loads(r.read())["result"]


def embed_batch(texts: list[str]) -> list[list[float]]:
    body = json.dumps({"model": "voyage-3-lite", "input": texts}).encode()
    for attempt in range(5):
        req = urllib.request.Request(
            "https://api.voyageai.com/v1/embeddings",
            data=body,
            headers={"Authorization": f"Bearer {VOYAGE_API_KEY}", "Content-Type": "application/json"},
            method="POST",
        )
        try:
            with urllib.request.urlopen(req, timeout=60) as r:
                data = json.loads(r.read())
            return [item["embedding"] for item in data["data"]]
        except urllib.error.HTTPError as e:
            if e.code == 429:
                wait = 10 * (2 ** attempt)
                print(f"   429 rate limit — aguardando {wait}s (tentativa {attempt+1}/5)...")
                time.sleep(wait)
            else:
                raise
    raise RuntimeError("Voyage AI: muitos erros 429 consecutivos")


def content_hash(text: str) -> str:
    return hashlib.md5(text.encode()).hexdigest()


def upsert_batch(rows: list[dict]):
    body = json.dumps(rows).encode()
    url = f"{SUPABASE_URL}/rest/v1/editorial_knowledge?on_conflict=source,content_hash"
    req = urllib.request.Request(
        url,
        data=body,
        headers={
            "apikey": SUPABASE_KEY,
            "Authorization": f"Bearer {SUPABASE_KEY}",
            "Content-Type": "application/json",
            "Prefer": "resolution=merge-duplicates",
        },
        method="POST",
    )
    with urllib.request.urlopen(req, timeout=30) as r:
        status = r.status
    if status not in (200, 201):
        raise RuntimeError(f"Supabase upsert failed: {status}")


def main():
    print("📚 Buscando posts do Sanity...")
    posts = sanity_fetch(
        '*[_type=="post" && defined(slug.current) && defined(publishedAt)]'
        '| order(publishedAt desc)'
        '{ title, "slug": slug.current, excerpt, category, publishedAt }'
    )
    print(f"   → {len(posts)} posts encontrados")

    if DRY_RUN:
        print("\n[DRY RUN] Primeiros 5 posts que seriam indexados:")
        for p in posts[:5]:
            print(f"  - [{p.get('category','?')}] {p['title']}")
        print("  ...\nAbortando (dry-run).")
        return

    # Monta os chunks
    chunks = []
    for p in posts:
        title   = p.get("title", "").strip()
        excerpt = p.get("excerpt", "").strip()
        cat     = p.get("category", "geral").strip()
        slug    = p.get("slug", "")
        pub     = p.get("publishedAt", "")[:10] if p.get("publishedAt") else None

        # Conteúdo que será embutido: título + resumo (o que o modelo "lembra")
        content = title
        if excerpt:
            content += f"\n{excerpt}"

        chunks.append({
            "source":       "blog-post",
            "category":     cat,
            "content":      content,
            "content_hash": content_hash(content),
            "slug":         slug,
            "pub":          pub,
        })

    print(f"\n⚡ Gerando embeddings em batches de {BATCH_SIZE}...")
    total = len(chunks)
    rows_to_upsert = []

    for i in range(0, total, BATCH_SIZE):
        batch = chunks[i : i + BATCH_SIZE]
        texts = [c["content"] for c in batch]
        embeddings = embed_batch(texts)

        for chunk, emb in zip(batch, embeddings):
            rows_to_upsert.append({
                "source":       chunk["source"],
                "category":     chunk["category"],
                "content":      chunk["content"],
                "content_hash": chunk["content_hash"],
                "example":      None,
                "edition_date": chunk["pub"],
                "metadata":     json.dumps({"slug": chunk["slug"]}),
                "embedding":    f"[{','.join(str(x) for x in emb)}]",
            })

        pct = min(i + BATCH_SIZE, total)
        print(f"   {pct}/{total} embeds gerados...")
        time.sleep(RATE_SLEEP)

    print(f"\n💾 Salvando {len(rows_to_upsert)} registros no Supabase...")
    UPSERT_BATCH = 50
    for i in range(0, len(rows_to_upsert), UPSERT_BATCH):
        upsert_batch(rows_to_upsert[i : i + UPSERT_BATCH])
        print(f"   {min(i + UPSERT_BATCH, len(rows_to_upsert))}/{len(rows_to_upsert)} salvos")

    print(f"\n✅ {len(rows_to_upsert)} posts indexados com sucesso.")
    print("   Use getSimilarPublishedTopics() no publish cron para evitar repetição semântica.")


if __name__ == "__main__":
    main()
