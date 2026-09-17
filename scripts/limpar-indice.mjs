/**
 * Limpeza de índice — tira da busca o que a máquina antiga produziu.
 *
 * Contexto: em 21/08/2026 o site foi de 67 impressões por dia para zero, no
 * dia exato em que o Google terminou de lançar o August 2026 Spam Update, que
 * mira scaled content abuse — publicação automatizada em massa. O acervo tinha
 * 1.016 posts em quatro meses, até 18 por dia, a maior parte reescrita de RSS.
 *
 * Este script marca `noindex` em toda notícia publicada antes de 11/09/2026
 * (dia em que o pipeline mudou) que nunca rendeu um clique. A página continua
 * no ar e navegável; sai do sitemap e pede ao Google para não indexar.
 *
 * O critério é o clique, não a impressão: impressão sem clique é o Google
 * mostrando algo que ninguém quis. As páginas cortadas somam 1.152 impressões
 * e zero clique em todo o período.
 *
 * Uso:
 *   node scripts/limpar-indice.mjs                 # relatório, não grava
 *   node scripts/limpar-indice.mjs --aplicar       # grava
 *   node scripts/limpar-indice.mjs --reverter      # desfaz pelo backup
 */
import { config } from 'dotenv'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'
import { createClient } from '@sanity/client'
import { GoogleAuth } from 'google-auth-library'
import { writeFileSync, readFileSync, existsSync } from 'fs'

const __dirname = dirname(fileURLToPath(import.meta.url))
config({ path: resolve(__dirname, '../.env.local'), quiet: true })

const APLICAR = process.argv.includes('--aplicar')
const REVERTER = process.argv.includes('--reverter')
const BACKUP = resolve(__dirname, '../limpeza-indice.json')

/** Dia em que o pipeline passou a publicar 3x ao dia com aprovação sua. */
const CORTE = '2026-09-11'

const sanity = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || 'production',
  token: process.env.SANITY_API_TOKEN,
  apiVersion: '2024-01-01',
  useCdn: false,
})

async function emLotes(itens, fn, tamanho = 50) {
  for (let i = 0; i < itens.length; i += tamanho) {
    const lote = itens.slice(i, i + tamanho)
    const tx = sanity.transaction()
    for (const it of lote) fn(tx, it)
    await tx.commit()
    process.stdout.write(`\r  gravados ${Math.min(i + tamanho, itens.length)}/${itens.length}`)
  }
  process.stdout.write('\n')
}

async function reverter() {
  // O backup é conveniência, não dependência: reversão que depende de arquivo
  // local não é reversão. Sem ele, o próprio Sanity diz quem está marcado.
  const lista = existsSync(BACKUP)
    ? JSON.parse(readFileSync(BACKUP, 'utf8'))
    : await sanity.fetch(`*[_type=="post" && noindex == true]{_id, "slug": slug.current, title}`)
  if (!lista.length) {
    console.log('Nenhuma página fora do índice. Nada a reverter.')
    return
  }
  console.log(`\nRevertendo ${lista.length} páginas para o índice...\n`)
  await emLotes(lista, (tx, p) => tx.patch(p._id, { unset: ['noindex', 'noindexEm', 'noindexMotivo'] }))
  console.log('\nFeito. O sitemap volta a anunciá-las na próxima requisição.\n')
}

async function main() {
  if (!process.env.SANITY_API_TOKEN) {
    console.error('SANITY_API_TOKEN ausente no .env.local.')
    process.exit(1)
  }
  if (REVERTER) return reverter()

  // Cliques por página, desde que o site existe. Uma única impressão não salva
  // a página; um clique salva, porque significa que alguém quis aquilo.
  const auth = new GoogleAuth({
    credentials: {
      client_email: process.env.GOOGLE_INDEXING_CLIENT_EMAIL,
      private_key: process.env.GOOGLE_INDEXING_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    },
    scopes: ['https://www.googleapis.com/auth/webmasters.readonly'],
  })
  const { token } = await (await auth.getClient()).getAccessToken()
  const hoje = new Date(Date.now() - 2 * 86400000).toISOString().slice(0, 10)
  const res = await fetch(
    `https://searchconsole.googleapis.com/webmasters/v3/sites/${encodeURIComponent('https://portalendinheirados.com.br/')}/searchAnalytics/query`,
    {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ startDate: '2026-06-01', endDate: hoje, dimensions: ['page'], rowLimit: 5000, type: 'web' }),
    },
  )
  if (!res.ok) {
    console.error('Search Console não respondeu; sem ele o critério não existe. Abortando.')
    process.exit(1)
  }
  const linhas = (await res.json()).rows ?? []
  const cliques = new Map(linhas.map(r => [
    r.keys[0].replace('https://portalendinheirados.com.br/blog/', '').replace(/\/$/, ''),
    r.clicks,
  ]))

  const posts = await sanity.fetch(
    `*[_type=="post" && status=="aprovado" && defined(slug.current)]{
      _id, "slug": slug.current, title, articleType, publishedAt, noindex
    }`,
  )
  const alvo = posts.filter(p =>
    p.articleType === 'news' &&
    p.publishedAt < CORTE &&
    (cliques.get(p.slug) ?? 0) === 0 &&
    p.noindex !== true,
  )
  const jaFora = posts.filter(p => p.noindex === true).length
  const resta = posts.length - alvo.length - jaFora

  console.log(APLICAR ? '\n⚠  GRAVANDO no Sanity\n' : '\n○  RELATÓRIO — nada gravado. Use --aplicar para valer.\n')
  console.log(`  posts aprovados hoje:       ${posts.length}`)
  console.log(`  já fora do índice:          ${jaFora}`)
  console.log(`  sairão agora:               ${alvo.length}`)
  console.log(`  continuam na busca:         ${resta + jaFora === posts.length ? resta : posts.length - alvo.length}`)
  const porTipo = {}
  for (const p of posts.filter(x => !alvo.includes(x) && x.noindex !== true)) {
    porTipo[p.articleType ?? 'sem tipo'] = (porTipo[p.articleType ?? 'sem tipo'] ?? 0) + 1
  }
  console.log(`\n  o que fica: ${JSON.stringify(porTipo)}`)
  console.log('\n  amostra do que sai:')
  for (const p of alvo.slice(0, 8)) console.log(`    ${p.publishedAt.slice(0, 10)}  ${(p.title ?? '').slice(0, 62)}`)

  if (!alvo.length) { console.log('\nNada a fazer.\n'); return }
  if (!APLICAR) { console.log('\n  Para aplicar: node scripts/limpar-indice.mjs --aplicar\n'); return }

  writeFileSync(BACKUP, JSON.stringify(alvo.map(p => ({ _id: p._id, slug: p.slug, title: p.title })), null, 2))
  console.log(`\n  backup de ${alvo.length} páginas em limpeza-indice.json (use --reverter para desfazer)\n`)

  const quando = new Date().toISOString()
  await emLotes(alvo, (tx, p) => tx.patch(p._id, {
    set: { noindex: true, noindexEm: quando, noindexMotivo: 'limpeza pos August 2026 Spam Update' },
  }))

  console.log('\n  Pronto. O sitemap cai na próxima requisição; as páginas passam a')
  console.log('  responder com noindex conforme o cache revalida (1h).\n')
}

main().catch(err => { console.error('\nErro:', err); process.exit(1) })
