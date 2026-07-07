#!/usr/bin/env python3
"""
Scraper do The News → RAG (sem LLM)
Extrai padrões reais das edições via regex + heurística.

Usage:
  VOYAGE_API_KEY=... SUPABASE_URL=... SUPABASE_SERVICE_KEY=... \
  python scrape_the_news.py [--editions 20] [--source geral|money|night]
"""
import os, sys, json, re, time, urllib.request, urllib.parse, argparse, hashlib
from datetime import date

VOYAGE_API_KEY = os.environ["VOYAGE_API_KEY"]
SUPABASE_URL   = os.environ["SUPABASE_URL"]
SUPABASE_KEY   = os.environ["SUPABASE_SERVICE_KEY"]

HEADERS = {
    "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36",
    "Accept": "text/html,application/xhtml+xml",
}

SOURCE_MAP = {
    "geral": "the-news-geral",
    "money": "tns-money",
    "night": "the-news-night",
}

# ─── HTTP ─────────────────────────────────────────────────────────────────────

def get(url: str, timeout=15) -> str:
    req = urllib.request.Request(url, headers=HEADERS)
    with urllib.request.urlopen(req, timeout=timeout) as r:
        return r.read().decode("utf-8", errors="replace")

def strip_html(html: str) -> str:
    text = re.sub(r"<style[^>]*>[\s\S]*?</style>", "", html, flags=re.I)
    text = re.sub(r"<script[^>]*>[\s\S]*?</script>", "", text, flags=re.I)
    text = re.sub(r"<br\s*/?>", "\n", text, flags=re.I)
    text = re.sub(r"</p>|</div>|</li>|</h[1-6]>", "\n", text, flags=re.I)
    text = re.sub(r"<[^>]+>", "", text)
    text = re.sub(r"&nbsp;", " ", text)
    text = re.sub(r"&amp;", "&", text)
    text = re.sub(r"&lt;", "<", text)
    text = re.sub(r"&gt;", ">", text)
    text = re.sub(r"&#\d+;", "", text)
    text = re.sub(r"[ \t]{2,}", " ", text)
    text = re.sub(r"\n{3,}", "\n\n", text)
    return text.strip()

def extract_headings(html: str) -> list[str]:
    """Extrai texto de h1/h2/h3 — são os títulos reais das matérias."""
    headings = []
    for m in re.finditer(r"<h[123][^>]*>([\s\S]*?)</h[123]>", html, re.I):
        text = re.sub(r"<[^>]+>", "", m.group(1)).strip()
        text = re.sub(r"\s+", " ", text)
        if 15 < len(text) < 120:
            headings.append(text)
    return headings

def extract_bold_phrases(html: str) -> list[str]:
    """Extrai frases em negrito — marcadores como 'Zoom out:', 'Bottom-line:'."""
    phrases = []
    for m in re.finditer(r"<(?:strong|b)[^>]*>([\s\S]*?)</(?:strong|b)>", html, re.I):
        text = re.sub(r"<[^>]+>", "", m.group(1)).strip()
        text = re.sub(r"\s+", " ", text)
        if 3 < len(text) < 80:
            phrases.append(text)
    return phrases

def extract_paragraphs(text: str, min_len=80, max_len=400) -> list[str]:
    """Parágrafos limpos de tamanho ideal para exemplos."""
    paras = []
    for p in text.split("\n\n"):
        p = p.strip()
        if min_len <= len(p) <= max_len and not p.startswith("http") and not p.startswith("©"):
            paras.append(p)
    return paras

# ─── Descoberta de URLs ───────────────────────────────────────────────────────

def get_edition_urls(source: str, limit: int) -> list[str]:
    if source == "money":
        base = "https://money.thenews.com.br"
    else:
        base = "https://thenewscc.beehiiv.com"

    archive_url = f"{base}/archive"
    print(f"📰 Buscando arquivo: {archive_url}")
    html = get(archive_url)

    rel = [base + u for u in re.findall(r'href="(/p/[^"#?]+)"', html)]
    absolute = re.findall(rf'href="({re.escape(base)}/p/[^"#?]+)"', html)
    all_urls = list(dict.fromkeys(rel + absolute))

    if source == "night":
        all_urls = [u for u in all_urls if "night" in u.lower()]
    elif source == "geral":
        all_urls = [u for u in all_urls if "night" not in u.lower()]

    # Remove duplicatas mantendo ordem
    seen = set()
    unique = []
    for u in all_urls:
        if u not in seen:
            seen.add(u)
            unique.append(u)

    print(f"   {len(unique)} URLs encontradas → usando {min(limit, len(unique))}")
    return unique[:limit]

# ─── Extração de padrões por heurística ──────────────────────────────────────

ZOOM_OUT_PATTERNS = [
    r"(?i)(zoom[\s\-]?out|bottom[\s\-]?line|contexto|por que isso importa|o que isso significa|na prática|o pano de fundo)",
]

def classify_paragraph(text: str, idx: int, total: int) -> tuple[str, str] | None:
    """
    Retorna (category, content_description) ou None se não for interessante.
    """
    t = text.strip()
    if len(t) < 60:
        return None

    # Abertura: primeiro ou segundo parágrafo, curto e sem jargão técnico
    if idx <= 1 and len(t) < 250 and not re.search(r"https?://|@|copyright|©", t, re.I):
        return ("abertura", "Abertura da edição — frase filosófica ou observação de contexto")

    # Zoom out / marcadores de profundidade
    for pat in ZOOM_OUT_PATTERNS:
        if re.search(pat, t):
            return ("zoom-out", "Marcador de profundidade: zoom out, bottom-line ou contextualização")

    # Tom: parágrafos conversacionais com "você", contrações, analogias
    if re.search(r"\b(você|seu|sua|pra|pro|né|tá|bolso|conta|salário)\b", t, re.I) and len(t) < 350:
        return ("tom", "Tom de voz: explicação direta para o leitor, linguagem próxima")

    # Fechamento: último ou penúltimo parágrafo
    if idx >= total - 2 and len(t) < 300:
        return ("estrutura", "Fecho de seção ou edição")

    # Parágrafo factual com número: estrutura de "what"
    if re.search(r"\b\d+[%,.]|\bR\$\s*\d|\bbilhões?|\bmilhões?|\bpontos?\b", t):
        return ("estrutura", "Parágrafo factual com dado numérico — estrutura do 'what'")

    return None

def extract_patterns_from_edition(html: str, url: str, source: str) -> list[dict]:
    patterns = []

    # 1. Títulos → categoria "titulo"
    # content = texto real do título (o que o modelo deve aprender)
    headings = extract_headings(html)
    for h in headings[:8]:
        if re.search(r"^\w.*\?$", h):
            tag = "pergunta direta"
        elif re.search(r"\bvs?\b|versus|contra|ou\b", h, re.I):
            tag = "contrastivo"
        elif re.search(r"\b\d+\b", h):
            tag = "com número"
        elif re.search(r"^(como|por que|quando|o que|quem|onde)\b", h, re.I):
            tag = "explicativo"
        else:
            tag = "declarativo"
        patterns.append({
            "category": "titulo",
            "content": h,            # texto real — base da busca semântica
            "example": tag,          # tag descritiva como metadado
            "url": url,
            "source": SOURCE_MAP[source],
        })

    # 2. Parágrafos completos pós heading → "zoom-out" com contexto
    bolds = extract_bold_phrases(html)
    zoom_markers = [b for b in bolds if re.search(
        r"(?i)(zoom|bottom.line|contexto|por que|o pano|na prática|atenção|importante)", b
    )]
    # Pega o parágrafo que segue o marcador (mais útil do que só o marcador)
    plain = strip_html(html)
    for z in zoom_markers[:5]:
        # Tenta encontrar o parágrafo logo após o marcador no texto
        idx = plain.find(z)
        if idx != -1:
            after = plain[idx + len(z):idx + len(z) + 400].strip()
            after_para = after.split('\n\n')[0].strip()
            text = (z + " " + after_para).strip()
        else:
            text = z
        if len(text) >= 40:
            patterns.append({
                "category": "zoom-out",
                "content": text[:350],
                "example": z,
                "url": url,
                "source": SOURCE_MAP[source],
            })

    # 3. Parágrafos → abertura, tom, estrutura
    # content = texto real do parágrafo (o que o modelo aprende por exemplo)
    paras = extract_paragraphs(plain, min_len=80, max_len=500)
    for i, p in enumerate(paras[:30]):
        result = classify_paragraph(p, i, len(paras))
        if result:
            cat, desc = result
            patterns.append({
                "category": cat,
                "content": p[:350],   # texto real
                "example": desc,      # classificação como metadado
                "url": url,
                "source": SOURCE_MAP[source],
            })

    return patterns

# ─── Voyage AI embeddings ─────────────────────────────────────────────────────

def embed(texts: list[str], retries=4) -> list[list[float]]:
    payload = json.dumps({"model": "voyage-3-lite", "input": texts}).encode()
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
            with urllib.request.urlopen(req, timeout=30) as r:
                result = json.load(r)
            return [item["embedding"] for item in result["data"]]
        except urllib.error.HTTPError as e:
            if e.code == 429 and attempt < retries - 1:
                wait = 15 * (attempt + 1)
                print(f"   ⏳ Rate limit, aguardando {wait}s...")
                time.sleep(wait)
            else:
                raise

# ─── Supabase upsert ──────────────────────────────────────────────────────────

def upsert(records: list[dict]):
    payload = json.dumps(records).encode()
    req = urllib.request.Request(
        f"{SUPABASE_URL}/rest/v1/editorial_knowledge?on_conflict=source,content_hash",
        data=payload,
        headers={
            "apikey": SUPABASE_KEY,
            "Authorization": f"Bearer {SUPABASE_KEY}",
            "Content-Type": "application/json",
            "Prefer": "return=minimal,resolution=ignore-duplicates",
        },
        method="POST",
    )
    try:
        with urllib.request.urlopen(req, timeout=20) as r:
            return r.status
    except urllib.error.HTTPError as e:
        raise RuntimeError(f"Supabase {e.code}: {e.read().decode()}") from e

# ─── Main ─────────────────────────────────────────────────────────────────────

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--editions", type=int, default=20)
    parser.add_argument("--source", choices=["geral", "money", "night"], default="geral")
    args = parser.parse_args()

    urls = get_edition_urls(args.source, args.editions)
    if not urls:
        print("❌ Nenhuma URL encontrada.")
        sys.exit(1)

    all_patterns: list[dict] = []
    today = date.today().isoformat()

    for i, url in enumerate(urls, 1):
        print(f"\n[{i}/{len(urls)}] {url}")
        try:
            html = get(url)
            patterns = extract_patterns_from_edition(html, url, args.source)
            print(f"   🔍 {len(patterns)} padrões extraídos")
            all_patterns.extend(patterns)
            time.sleep(1.0)
        except Exception as e:
            print(f"   ❌ {e}")
            continue

    # Deduplica pelo conteúdo real (content)
    seen_content: set[str] = set()
    unique_patterns = []
    for p in all_patterns:
        key = p["content"][:120]
        if key not in seen_content:
            seen_content.add(key)
            unique_patterns.append(p)

    print(f"\n✂️  {len(unique_patterns)} padrões únicos de {len(urls)} edições")

    if not unique_patterns:
        print("❌ Nenhum padrão extraído.")
        sys.exit(1)

    # Embeda e insere em batches
    batch_size = 10
    inserted = 0

    for i in range(0, len(unique_patterns), batch_size):
        batch = unique_patterns[i:i+batch_size]
        texts = [p["content"] for p in batch]
        print(f"🔢 Embeddings batch {i//batch_size + 1}/{-(-len(unique_patterns)//batch_size)}...")
        embeddings = embed(texts)
        time.sleep(3)

        records = [
            {
                "source":        p["source"],
                "category":      p["category"],
                "content":       p["content"],
                "content_hash":  hashlib.sha256(p["content"].encode()).hexdigest(),
                "example":       p.get("example") or None,
                "edition_date":  today,
                "metadata":      {"url": p.get("url", "")},
                "embedding":     "[" + ",".join(str(x) for x in emb) + "]",
            }
            for p, emb in zip(batch, embeddings)
        ]

        status = upsert(records)
        inserted += len(records)
        print(f"   ✅ HTTP {status} — {inserted} total inseridos")

    print(f"\n🎉 Concluído: {inserted} padrões no Supabase (source: {SOURCE_MAP[args.source]})")

if __name__ == "__main__":
    main()
