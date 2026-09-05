/**
 * Varredura e conserto das capas quebradas.
 *
 * Por que existe: as capas vêm de raspagem de OG de terceiros, e parte delas
 * não é imagem. YouTube e Facebook são os piores casos — respondem HTTP 200
 * com uma página HTML, então qualquer checagem que olhe só o status code passa
 * batido. Numa amostra de 40 posts, 6 (15%) estavam assim.
 *
 * O proxy em /api/img já mascara isso na hora de exibir, buscando uma foto no
 * Pexels. Mas o dado errado continua no Sanity, e cada post quebrado gasta uma
 * chamada de API na primeira visita. Este script conserta na origem: testa cada
 * capa, e nas que falham grava uma foto boa direto no documento.
 *
 * Uso:
 *   node scripts/corrigir-capas.mjs              # só relatório, não escreve nada
 *   node scripts/corrigir-capas.mjs --aplicar    # grava as correções no Sanity
 *   node scripts/corrigir-capas.mjs --aplicar --limite 50
 *
 * Roda sempre em modo relatório primeiro. Só escreve com --aplicar explícito.
 */

import { config } from 'dotenv'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'
import { createClient } from '@sanity/client'
import { writeFileSync } from 'fs'

const __dirname = dirname(fileURLToPath(import.meta.url))
config({ path: resolve(__dirname, '../.env.local') })

const APLICAR = process.argv.includes('--aplicar')
const iLimite = process.argv.indexOf('--limite')
const LIMITE = iLimite > -1 ? Number(process.argv[iLimite + 1]) : Infinity

const sanity = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || 'production',
  token: process.env.SANITY_API_TOKEN,
  apiVersion: '2024-01-01',
  useCdn: false,
})

// ─── Regras de capa (espelham src/lib/images.ts) ─────────────────────────────

const HOSTS_INVALIDOS = [
  'youtube.com', 'youtu.be', 'lookaside.fbsbx.com',
  'facebook.com', 'instagram.com', 'twitter.com', 'x.com',
]

const BUSCA_POR_CATEGORIA = {
  'notícias': 'brazil business newspaper finance',
  'economia': 'economy finance chart brazil',
  'investimentos': 'investment stock market chart',
  'educação financeira': 'personal finance planning money',
  'ganhar dinheiro': 'entrepreneur working laptop money',
  'empréstimo': 'bank loan contract signing',
  'cartão de crédito': 'credit card payment hands',
  'financiamento': 'house keys mortgage contract',
  'previdência': 'retirement senior couple planning',
}

function buscaDeFallback(categoria) {
  return BUSCA_POR_CATEGORIA[(categoria || '').toLowerCase().trim()]
    ?? 'finance money brazil business'
}

function hostInvalido(url) {
  try {
    const h = new URL(url).hostname.toLowerCase().replace(/^www\./, '')
    return HOSTS_INVALIDOS.some(x => h === x || h.endsWith('.' + x))
  } catch {
    return true
  }
}

// ─── Teste de capa ───────────────────────────────────────────────────────────

/**
 * Devolve { ok, motivo }. A checagem de content-type é o que pega o caso do
 * YouTube: status 200, corpo HTML. Um HEAD não bastaria — vários CDNs não
 * respondem HEAD, então usamos GET e abortamos assim que os cabeçalhos chegam.
 */
async function testarCapa(url) {
  if (!url) return { ok: false, motivo: 'sem-url' }
  if (hostInvalido(url)) return { ok: false, motivo: 'host-invalido' }

  const ctrl = new AbortController()
  const timer = setTimeout(() => ctrl.abort(), 15_000)
  try {
    const res = await fetch(url, {
      signal: ctrl.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/131.0 Safari/537.36',
        Referer: 'https://portalendinheirados.com.br/',
        Accept: 'image/avif,image/webp,image/*,*/*;q=0.8',
      },
    })
    if (!res.ok) return { ok: false, motivo: `http-${res.status}` }
    const ct = (res.headers.get('content-type') || '').split(';')[0].trim().toLowerCase()
    // Alguns servidores mandam 'webp' ou 'image' sem o prefixo completo. São
    // imagens válidas, e exigir 'image/' as reprovava por engano.
    const TIPOS_SOLTOS = ['webp', 'jpeg', 'jpg', 'png', 'gif', 'avif', 'image']
    if (!ct.startsWith('image/') && !TIPOS_SOLTOS.includes(ct)) {
      return { ok: false, motivo: `tipo-${ct || 'vazio'}` }
    }
    const tam = Number(res.headers.get('content-length') || 0)
    if (tam && tam < 1024) return { ok: false, motivo: 'muito-pequena' }
    return { ok: true, motivo: ct }
  } catch (err) {
    return { ok: false, motivo: err.name === 'AbortError' ? 'timeout' : 'erro-rede' }
  } finally {
    clearTimeout(timer)
  }
}

// ─── Busca de foto nova ──────────────────────────────────────────────────────

const jaUsadas = new Set()

/** Pexels primeiro, Unsplash de reserva. Evita repetir foto entre posts. */
async function buscarFoto(query) {
  if (process.env.PEXELS_API_KEY) {
    for (const page of [1, 2, 3]) {
      try {
        const r = await fetch(
          `https://api.pexels.com/v1/search?query=${encodeURIComponent(query)}&per_page=20&page=${page}&orientation=landscape`,
          { headers: { Authorization: process.env.PEXELS_API_KEY }, signal: AbortSignal.timeout(15_000) },
        )
        if (r.status === 429) { await esperar(20_000); continue }
        const d = await r.json()
        const livre = (d?.photos ?? []).find(p => !jaUsadas.has(p.src?.large2x || p.src?.large))
        if (livre) {
          const url = livre.src.large2x || livre.src.large
          jaUsadas.add(url)
          return { url, alt: livre.alt || query, credit: `Foto: ${livre.photographer} via Pexels` }
        }
      } catch { /* tenta a próxima página */ }
    }
  }
  if (process.env.UNSPLASH_ACCESS_KEY) {
    try {
      const r = await fetch(
        `https://api.unsplash.com/photos/random?query=${encodeURIComponent(query)}&orientation=landscape&content_filter=high`,
        { headers: { Authorization: `Client-ID ${process.env.UNSPLASH_ACCESS_KEY}` }, signal: AbortSignal.timeout(15_000) },
      )
      const u = await r.json()
      if (u?.urls?.regular) {
        jaUsadas.add(u.urls.regular)
        return { url: u.urls.regular, alt: u.alt_description || query, credit: `Foto: ${u.user?.name ?? 'Unsplash'} via Unsplash` }
      }
    } catch { /* desiste */ }
  }
  return null
}

const esperar = ms => new Promise(r => setTimeout(r, ms))

/** Executa em lotes, para não abrir 900 conexões de uma vez. */
async function emLotes(itens, tamanho, fn) {
  const saida = []
  for (let i = 0; i < itens.length; i += tamanho) {
    saida.push(...await Promise.all(itens.slice(i, i + tamanho).map(fn)))
    process.stdout.write(`\r  testadas ${Math.min(i + tamanho, itens.length)}/${itens.length}`)
  }
  process.stdout.write('\n')
  return saida
}

// ─── Execução ────────────────────────────────────────────────────────────────

async function main() {
  if (!process.env.SANITY_API_TOKEN) {
    console.error('SANITY_API_TOKEN ausente no .env.local. Sem ele não dá para gravar.')
    process.exit(1)
  }

  console.log(APLICAR
    ? '\n⚠  MODO GRAVAÇÃO — as correções serão salvas no Sanity\n'
    : '\n○  MODO RELATÓRIO — nada será alterado. Use --aplicar para gravar.\n')

  const posts = await sanity.fetch(
    `*[_type=="post" && defined(coverImage.url)]|order(publishedAt desc){
      _id, title, category, publishedAt, "url": coverImage.url
    }`,
  )
  console.log(`${posts.length} posts com capa.\n`)

  console.log('Testando cada capa (pode levar alguns minutos):')
  const resultados = await emLotes(posts, 8, async p => ({ ...p, teste: await testarCapa(p.url) }))

  const quebrados = resultados.filter(r => !r.teste.ok)
  const porMotivo = {}
  for (const q of quebrados) porMotivo[q.teste.motivo] = (porMotivo[q.teste.motivo] || 0) + 1

  console.log(`\n─── Resultado ───────────────────────────────────`)
  console.log(`  boas:      ${resultados.length - quebrados.length}`)
  console.log(`  quebradas: ${quebrados.length}  (${(quebrados.length / resultados.length * 100).toFixed(1)}%)\n`)
  if (quebrados.length) {
    console.log('  por motivo:')
    for (const [m, n] of Object.entries(porMotivo).sort((a, b) => b[1] - a[1])) {
      console.log(`    ${String(n).padStart(4)}  ${m}`)
    }
  }

  const relatorio = resolve(__dirname, '../capas-quebradas.json')
  writeFileSync(relatorio, JSON.stringify(
    quebrados.map(q => ({ _id: q._id, title: q.title, category: q.category, url: q.url, motivo: q.teste.motivo })),
    null, 2,
  ))
  console.log(`\n  lista completa em: ${relatorio}`)

  if (!quebrados.length) return
  if (!APLICAR) {
    console.log('\n  Para corrigir, rode de novo com --aplicar\n')
    return
  }

  const alvo = quebrados.slice(0, LIMITE)
  console.log(`\n─── Corrigindo ${alvo.length} post(s) ───────────────\n`)

  let ok = 0, falhou = 0
  for (const [i, p] of alvo.entries()) {
    const query = buscaDeFallback(p.category)
    const foto = await buscarFoto(query)
    if (!foto) {
      console.log(`  ${i + 1}/${alvo.length}  ✗  ${p.title.slice(0, 52)} — banco não devolveu foto`)
      falhou++
      continue
    }
    try {
      await sanity.patch(p._id).set({
        coverImage: { url: foto.url, alt: foto.alt, credit: foto.credit },
        updatedAt: new Date().toISOString(),
      }).commit()
      console.log(`  ${i + 1}/${alvo.length}  ✓  ${p.title.slice(0, 52)}`)
      ok++
    } catch (err) {
      console.log(`  ${i + 1}/${alvo.length}  ✗  ${p.title.slice(0, 52)} — ${err.message?.slice(0, 60)}`)
      falhou++
    }
    // respeita o limite do Pexels (200/hora no plano gratuito)
    await esperar(1200)
  }

  console.log(`\n─── Fim ─────────────────────────────────────────`)
  console.log(`  corrigidos: ${ok}`)
  console.log(`  falharam:   ${falhou}`)
  console.log(`\n  O site revalida em 60s. Confira em portalendinheirados.com.br\n`)
}

main().catch(err => {
  console.error('\nErro:', err)
  process.exit(1)
})
