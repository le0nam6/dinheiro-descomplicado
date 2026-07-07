import { getEditionByDate, getEditions } from '@/lib/sanity'
import { ShareStory } from '@/components/ShareStory'
import { ReferralInline } from '@/components/ReferralInline'
import { IconClock, IconExternalLink, IconArrowRight } from '@tabler/icons-react'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'

export const revalidate = 1800

type Source = { name: string; url: string }
type StoryImage = { url: string; alt?: string; credit?: string }
type Story = { _key: string; emoji?: string; tag?: string; headline: string; hook?: string; what?: string; why?: string; image?: StoryImage; sources?: Source[] }
type Quote = { _key: string; label: string; value: string; changePct: number }

// Block types (new builder format)
type StoryBlock = { _type: 'storyBlock'; _key: string; format?: string; emoji?: string; tag?: string; headline?: string; sourceUrl?: string; hook?: string; what?: string; why?: string; deepStat?: string; deepImplication?: string; deepQuote?: string; statNumber?: string; statLabel?: string; image?: { url?: string; alt?: string; credit?: string } }
type HeadlinesBlock = { _type: 'headlinesBlock'; _key: string; sectionTitle?: string; items?: Array<{ _key: string; emoji?: string; headline?: string; sourceUrl?: string }> }
type MarketBlock = { _type: 'marketBlock'; _key: string; items?: Array<{ _key: string; label: string; value: string; changePct: number }> }
type CuriosidadeBlock = { _type: 'curiosidadeBlock'; _key: string; text?: string }
type PalavraBlock = { _type: 'palavraBlock'; _key: string; word?: string; meaning?: string; application?: string }
type FeaturedPostsBlock = { _type: 'featuredPostsBlock'; _key: string; posts?: Array<{ _key: string; title: string; slug: string; excerpt?: string; category?: string }> }
type RecomendacaoBlock = { _type: 'recomendacaoBlock'; _key: string; text?: string }
type ReflexaoBlock = { _type: 'reflexaoBlock'; _key: string; text?: string }
type PubliBlock = { _type: 'publiBlock'; _key: string; sponsor?: string; logoUrl?: string; link?: string; text?: string }
type EditionBlock = StoryBlock | HeadlinesBlock | MarketBlock | CuriosidadeBlock | PalavraBlock | FeaturedPostsBlock | RecomendacaoBlock | ReflexaoBlock | PubliBlock

function slugifyHeadline(s: string) {
  return s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 60)
}

function formatDate(date: string) {
  const d = new Date(date + 'T12:00:00')
  return d.toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' })
}

export async function generateStaticParams() {
  const editions = await getEditions(60)
  return editions.map((e: { slug: { current: string } }) => ({ date: e.slug.current }))
}

export async function generateMetadata({ params }: { params: Promise<{ date: string }> }): Promise<Metadata> {
  const { date } = await params
  const ed = await getEditionByDate(date)
  if (!ed) return {}
  return {
    title: ed.title,
    description: ed.intro || `O compilado do mercado financeiro de ${formatDate(date)} em poucos minutos.`,
    alternates: { canonical: `/edicao/${date}` },
    openGraph: { type: 'article', url: `/edicao/${date}`, title: ed.title, description: ed.intro },
  }
}

// ── Block renderers ───────────────────────────────────────────────────────────

function StoryBlockView({ block, idx, date, pageUrl }: { block: StoryBlock; idx: number; date: string; pageUrl: string }) {
  const headline = block.headline || ''
  const id = slugifyHeadline(headline)
  const isDeep = block.format === 'deep'
  const isStat = block.format === 'stat'

  return (
    <section key={block._key} id={id} className="scroll-mt-24">
      <div className="flex items-center gap-2 mb-3">
        {block.emoji && <span className="text-2xl">{block.emoji}</span>}
        {block.tag && <span className="text-xs font-bold text-green-700 bg-green-50 px-2.5 py-1 rounded-full uppercase tracking-wide">{block.tag}</span>}
      </div>
      {headline && <h2 className="text-2xl font-extrabold text-gray-900 leading-snug mb-3">{headline}</h2>}

      {block.hook && <p className="text-[17px] text-gray-500 mb-4 leading-relaxed">{block.hook}</p>}

      {block.image?.url && (
        <figure className="mb-4">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={block.image.url} alt={block.image.alt || headline} className="w-full rounded-xl object-cover max-h-72" loading="lazy" />
          {block.image.credit && <figcaption className="text-[11px] text-gray-400 mt-1.5">{block.image.credit}</figcaption>}
        </figure>
      )}

      {isStat && block.statNumber && (
        <div className="my-5 text-center bg-gray-50 border border-gray-200 rounded-2xl p-6">
          <p className="text-5xl font-black text-gray-900 leading-none mb-2">{block.statNumber}</p>
          {block.statLabel && <p className="text-gray-600 text-base">{block.statLabel}</p>}
        </div>
      )}

      {block.what && <p className="text-gray-800 text-[17px] leading-relaxed mb-4">{block.what}</p>}
      {block.why && <p className="text-gray-600 text-[16px] leading-relaxed mb-4 italic">{block.why}</p>}

      {isDeep && (
        <>
          {block.deepStat && (
            <div className="my-4 border-l-4 border-green-500 pl-4 bg-green-50 rounded-r-xl py-3">
              <p className="text-sm font-bold text-green-700 uppercase tracking-wide mb-1">Dado em destaque</p>
              <p className="text-gray-900 font-semibold text-[17px]">{block.deepStat}</p>
            </div>
          )}
          {block.deepImplication && (
            <p className="text-gray-700 text-[16px] leading-relaxed mb-4 bg-amber-50 border border-amber-100 rounded-xl p-4">{block.deepImplication}</p>
          )}
          {block.deepQuote && (
            <blockquote className="border-l-4 border-gray-300 pl-4 my-4 italic text-gray-600 text-[16px] leading-relaxed">{block.deepQuote}</blockquote>
          )}
        </>
      )}

      <div className="flex flex-wrap items-center justify-between gap-3 mt-4">
        {block.sourceUrl ? (
          <a href={block.sourceUrl} target="_blank" rel="noopener noreferrer nofollow" className="inline-flex items-center gap-1 text-xs text-green-700 hover:underline">
            Fonte <IconExternalLink size={12} stroke={2} />
          </a>
        ) : <span />}
        {headline && <ShareStory headline={headline} summary={block.what || block.hook || ''} url={`${pageUrl}#${id}`} />}
      </div>

      <hr className="mt-10 border-gray-100" />
      {idx === 1 && <ReferralInline seed={date} />}
    </section>
  )
}

function HeadlinesBlockView({ block }: { block: HeadlinesBlock }) {
  if (!block.items?.length) return null
  return (
    <section className="rounded-2xl border border-gray-200 p-5 bg-gray-50">
      {block.sectionTitle && <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-3">{block.sectionTitle}</p>}
      <ul className="space-y-2">
        {block.items.map(item => (
          <li key={item._key} className="flex items-start gap-2 text-sm text-gray-700">
            {item.emoji && <span>{item.emoji}</span>}
            {item.sourceUrl ? (
              <a href={item.sourceUrl} target="_blank" rel="noopener noreferrer nofollow" className="hover:text-green-700 hover:underline">{item.headline}</a>
            ) : <span>{item.headline}</span>}
          </li>
        ))}
      </ul>
    </section>
  )
}

function MarketBlockView({ block }: { block: MarketBlock }) {
  if (!block.items?.length) return null
  return (
    <div className="bg-gray-900 rounded-2xl p-5">
      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Termômetro do mercado</p>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {block.items.map(q => {
          const up = q.changePct >= 0
          return (
            <div key={q._key} className="min-w-0">
              <p className="text-[11px] text-gray-400 truncate">{q.label}</p>
              <p className="text-white font-bold tabular-nums truncate">{q.value}</p>
              <p className={`text-xs font-semibold tabular-nums ${up ? 'text-green-400' : 'text-red-400'}`}>
                {up ? '▲' : '▼'} {Math.abs(q.changePct).toFixed(2)}%
              </p>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default async function EditionPage({ params }: { params: Promise<{ date: string }> }) {
  const { date } = await params
  const ed = await getEditionByDate(date)
  if (!ed) notFound()

  const blocks: EditionBlock[] = ed.blocks || []
  const stories: Story[] = ed.stories || []
  const useBlocks = blocks.length > 0
  const snapshot: Quote[] = ed.marketSnapshot || []
  const pageUrl = `https://portalendinheirados.com.br/edicao/${date}`
  const displayDate = ed.date || date

  // For blocks format: derive story count and summary from storyBlocks
  const storyBlocks = blocks.filter((b): b is StoryBlock => b._type === 'storyBlock')
  const storyCount = useBlocks ? storyBlocks.length : stories.length

  // Market from blocks (if no marketSnapshot field)
  const marketBlock = blocks.find((b): b is MarketBlock => b._type === 'marketBlock')

  return (
    <article className="max-w-2xl mx-auto">
      {/* Cabeçalho */}
      <header className="mb-8">
        <Link href="/edicao" className="text-sm text-green-700 font-medium hover:underline">← Todas as edições</Link>
        <div className="mt-4 flex items-center gap-2 flex-wrap">
          <span className="text-sm font-semibold text-green-700 uppercase tracking-wide">🗞️ A Edição</span>
          {ed.number && <span className="text-xs font-bold text-green-700 bg-green-100 px-2 py-0.5 rounded-full">#{ed.number}</span>}
          <span className="text-sm text-gray-400">·</span>
          <span className="text-sm text-gray-500 capitalize">{formatDate(displayDate)}</span>
        </div>

        {ed.punchline && (
          <p className="mt-3 text-xl md:text-2xl font-extrabold text-gray-900 leading-snug border-l-4 border-green-500 pl-4">
            {ed.punchline}
          </p>
        )}

        <h1 className="text-2xl md:text-3xl font-extrabold text-gray-900 mt-5 leading-tight">{ed.title}</h1>
        {ed.intro && <p className="text-lg text-gray-600 mt-4 leading-relaxed">{ed.intro}</p>}
        <div className="flex items-center gap-2 mt-4 text-sm text-gray-400">
          <IconClock size={16} stroke={1.75} />
          <span>Leitura de {ed.readingTime || 4} min · {storyCount} assuntos</span>
        </div>
      </header>

      {/* Termômetro do mercado (campo antigo) */}
      {!useBlocks && snapshot.length > 0 && (
        <div className="mb-10 bg-gray-900 rounded-2xl p-5">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Termômetro do mercado</p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {snapshot.map(q => {
              const up = q.changePct >= 0
              return (
                <div key={q._key} className="min-w-0">
                  <p className="text-[11px] text-gray-400 truncate">{q.label}</p>
                  <p className="text-white font-bold tabular-nums truncate">{q.value}</p>
                  <p className={`text-xs font-semibold tabular-nums ${up ? 'text-green-400' : 'text-red-400'}`}>
                    {up ? '▲' : '▼'} {Math.abs(q.changePct).toFixed(2)}%
                  </p>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Índice rápido */}
      {storyCount > 0 && (
        <nav className="mb-10 border border-gray-200 rounded-2xl p-5 bg-gray-50">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Nesta edição</p>
          <ul className="space-y-1.5">
            {useBlocks
              ? storyBlocks.map(b => b.headline ? (
                  <li key={b._key}>
                    <a href={`#${slugifyHeadline(b.headline)}`} className="text-sm text-gray-700 hover:text-green-700 flex items-start gap-2">
                      <span>{b.emoji || '•'}</span>
                      <span className="hover:underline">{b.headline}</span>
                    </a>
                  </li>
                ) : null)
              : stories.map(s => (
                  <li key={s._key}>
                    <a href={`#${slugifyHeadline(s.headline)}`} className="text-sm text-gray-700 hover:text-green-700 flex items-start gap-2">
                      <span>{s.emoji || '•'}</span>
                      <span className="hover:underline">{s.headline}</span>
                    </a>
                  </li>
                ))
            }
          </ul>
        </nav>
      )}

      {/* ── Conteúdo: blocks (novo) ou stories (antigo) ── */}
      {useBlocks ? (
        <div className="space-y-10">
          {(() => {
            let storyIdx = 0
            return blocks.map(block => {
              if (block._type === 'storyBlock') {
                const el = <StoryBlockView key={block._key} block={block} idx={storyIdx} date={date} pageUrl={pageUrl} />
                storyIdx++
                return el
              }
              if (block._type === 'headlinesBlock') return <HeadlinesBlockView key={block._key} block={block} />
              if (block._type === 'marketBlock') return <MarketBlockView key={block._key} block={block} />
              if (block._type === 'curiosidadeBlock') return block.text ? (
                <div key={block._key} className="rounded-2xl bg-amber-50 border border-amber-100 p-5">
                  <p className="text-xs font-bold text-amber-700 uppercase tracking-wide mb-2">💡 Curiosidade do dia</p>
                  <p className="text-gray-800 text-[15px] leading-relaxed">{block.text}</p>
                </div>
              ) : null
              if (block._type === 'palavraBlock') return block.word ? (
                <div key={block._key} className="rounded-2xl border border-gray-200 p-5">
                  <p className="text-xs font-bold text-green-700 uppercase tracking-wide mb-2">📚 Palavra do dia</p>
                  <p className="text-lg font-extrabold text-gray-900">{block.word}</p>
                  {block.meaning && <p className="text-gray-600 text-[15px] mt-1 leading-relaxed">{block.meaning}</p>}
                  {block.application && <p className="text-gray-700 text-[15px] mt-2 leading-relaxed">{block.application}</p>}
                </div>
              ) : null
              if (block._type === 'featuredPostsBlock') return block.posts?.length ? (
                <div key={block._key} className="rounded-2xl bg-gray-50 border border-gray-200 p-5">
                  <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-1">Posts que você não pode deixar de ler</p>
                  <p className="text-sm text-gray-400 mb-4">Do nosso arquivo — para ir além das notícias de hoje</p>
                  <div className="space-y-4">
                    {block.posts.slice(0, 3).map((post, i) => (
                      <div key={post._key || i} className={i < block.posts!.length - 1 ? 'pb-4 border-b border-gray-200' : ''}>
                        {post.category && <p className="text-[10px] font-bold text-green-700 uppercase tracking-wide mb-1">{post.category}</p>}
                        <Link href={`/blog/${post.slug}`} className="text-base font-bold text-gray-900 hover:text-green-700 leading-snug block mb-1">{post.title}</Link>
                        {post.excerpt && <p className="text-sm text-gray-500 leading-relaxed">{post.excerpt.slice(0, 100)}…</p>}
                      </div>
                    ))}
                  </div>
                </div>
              ) : null
              if (block._type === 'recomendacaoBlock') return block.text ? (
                <div key={block._key} className="rounded-2xl bg-indigo-50 border border-indigo-100 p-5">
                  <p className="text-xs font-bold text-indigo-700 uppercase tracking-wide mb-2">🍿 Recomendação de sexta</p>
                  <p className="text-gray-800 text-[15px] leading-relaxed">{block.text}</p>
                </div>
              ) : null
              if (block._type === 'reflexaoBlock') return block.text ? (
                <div key={block._key} className="rounded-2xl bg-gray-900 text-white p-5">
                  <p className="text-xs font-bold text-green-400 uppercase tracking-wide mb-2">🌅 Reflexão de domingo</p>
                  <p className="text-gray-100 text-[15px] leading-relaxed">{block.text}</p>
                </div>
              ) : null
              if (block._type === 'publiBlock') return (block as PubliBlock).sponsor ? (
                <div key={block._key} className="rounded-2xl border-2 border-dashed border-gray-200 p-5 text-center">
                  <p className="text-[10px] text-gray-400 uppercase tracking-wide mb-2">Conteúdo patrocinado</p>
                  {(block as PubliBlock).link
                    ? <a href={(block as PubliBlock).link} target="_blank" rel="noopener noreferrer sponsored" className="text-base font-bold text-gray-900 hover:underline">{(block as PubliBlock).sponsor}</a>
                    : <p className="text-base font-bold text-gray-900">{(block as PubliBlock).sponsor}</p>
                  }
                  {(block as PubliBlock).text && <p className="text-sm text-gray-600 mt-2 leading-relaxed">{(block as PubliBlock).text}</p>}
                </div>
              ) : null
              return null
            })
          })()}
        </div>
      ) : (
        /* ── Formato antigo: stories[] ── */
        <div className="space-y-12">
          {stories.map((s, idx) => {
            const id = slugifyHeadline(s.headline)
            return (
              <section key={s._key} id={id} className="scroll-mt-24">
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-2xl">{s.emoji || '•'}</span>
                  {s.tag && <span className="text-xs font-bold text-green-700 bg-green-50 px-2.5 py-1 rounded-full uppercase tracking-wide">{s.tag}</span>}
                </div>
                <h2 className="text-2xl font-extrabold text-gray-900 leading-snug mb-3">{s.headline}</h2>
                {s.hook && <p className="text-[17px] text-gray-500 mb-4 leading-relaxed">{s.hook}</p>}
                {s.image?.url && (
                  <figure className="mb-4">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={s.image.url} alt={s.image.alt || s.headline} className="w-full rounded-xl object-cover max-h-72" loading="lazy" />
                    {s.image.credit && <figcaption className="text-[11px] text-gray-400 mt-1.5">{s.image.credit}</figcaption>}
                  </figure>
                )}
                {s.what && <p className="text-gray-800 text-[17px] leading-relaxed mb-4">{s.what}</p>}
                {s.why && <p className="text-gray-600 text-[16px] leading-relaxed mb-4 italic">{s.why}</p>}
                <div className="flex flex-wrap items-center justify-between gap-3 mt-4">
                  {s.sources && s.sources.length > 0 ? (
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-gray-400">
                      <span className="font-semibold">Fontes:</span>
                      {s.sources.map((src, i) => (
                        <a key={i} href={src.url} target="_blank" rel="noopener noreferrer nofollow" className="inline-flex items-center gap-1 text-green-700 hover:underline">
                          {src.name} <IconExternalLink size={12} stroke={2} />
                        </a>
                      ))}
                    </div>
                  ) : <span />}
                  <ShareStory headline={s.headline} summary={s.what || s.why || ''} url={`${pageUrl}#${id}`} />
                </div>
                <hr className="mt-10 border-gray-100" />
                {idx === 1 && <ReferralInline seed={date} />}
              </section>
            )
          })}
        </div>
      )}

      {/* Extras do formato antigo (só renderiza se não usa blocks) */}
      {!useBlocks && (ed.wordOfDay?.word || ed.curiosity || ed.recommendation || ed.reflection) && (
        <div className="mt-12 space-y-4">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Para fechar com estilo</p>
          {ed.wordOfDay?.word && (
            <div className="rounded-2xl border border-gray-200 p-5">
              <p className="text-xs font-bold text-green-700 uppercase tracking-wide mb-2">📚 Palavra do dia</p>
              <p className="text-lg font-extrabold text-gray-900">{ed.wordOfDay.word}</p>
              {ed.wordOfDay.meaning && <p className="text-gray-600 text-[15px] mt-1 leading-relaxed">{ed.wordOfDay.meaning}</p>}
              {ed.wordOfDay.application && <p className="text-gray-700 text-[15px] mt-2 leading-relaxed">{ed.wordOfDay.application}</p>}
            </div>
          )}
          {ed.curiosity && (
            <div className="rounded-2xl bg-amber-50 border border-amber-100 p-5">
              <p className="text-xs font-bold text-amber-700 uppercase tracking-wide mb-2">💡 Curiosidade do dia</p>
              <p className="text-gray-800 text-[15px] leading-relaxed">{ed.curiosity}</p>
            </div>
          )}
          {ed.recommendation && (
            <div className="rounded-2xl bg-indigo-50 border border-indigo-100 p-5">
              <p className="text-xs font-bold text-indigo-700 uppercase tracking-wide mb-2">🍿 Recomendação de sexta</p>
              <p className="text-gray-800 text-[15px] leading-relaxed">{ed.recommendation}</p>
            </div>
          )}
          {ed.reflection && (
            <div className="rounded-2xl bg-gray-900 text-white p-5">
              <p className="text-xs font-bold text-green-400 uppercase tracking-wide mb-2">🌅 Reflexão de domingo</p>
              <p className="text-gray-100 text-[15px] leading-relaxed">{ed.reflection}</p>
            </div>
          )}
        </div>
      )}

      {/* Market block do formato antigo que não veio por blocks (fallback) */}
      {useBlocks && !marketBlock && snapshot.length > 0 && (
        <div className="mt-8 bg-gray-900 rounded-2xl p-5">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Termômetro do mercado</p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {snapshot.map(q => {
              const up = q.changePct >= 0
              return (
                <div key={q._key} className="min-w-0">
                  <p className="text-[11px] text-gray-400 truncate">{q.label}</p>
                  <p className="text-white font-bold tabular-nums truncate">{q.value}</p>
                  <p className={`text-xs font-semibold tabular-nums ${up ? 'text-green-400' : 'text-red-400'}`}>
                    {up ? '▲' : '▼'} {Math.abs(q.changePct).toFixed(2)}%
                  </p>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Fecho da edição */}
      {ed.closing && (
        <div className="mt-10 mb-2 text-center">
          <p className="text-gray-500 text-[15px] italic">{ed.closing}</p>
        </div>
      )}

      {/* CTA newsletter */}
      <div className="mt-8 bg-gradient-to-br from-green-700 to-green-900 text-white rounded-2xl p-6 text-center">
        <p className="font-bold text-lg mb-1">Gostou da Edição?</p>
        <p className="text-green-100 text-sm mb-4">Em breve ela chega no seu e-mail toda manhã. Cadastre-se e seja avisado.</p>
        <a href="#newsletter" className="inline-flex items-center gap-1.5 bg-white text-green-800 font-bold text-sm px-5 py-2.5 rounded-xl hover:bg-green-50 transition-colors">
          Quero receber <IconArrowRight size={16} stroke={2} />
        </a>
      </div>

      {/* JSON-LD */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'NewsArticle',
            headline: ed.title,
            description: ed.intro,
            datePublished: ed.publishedAt,
            dateModified: ed.publishedAt,
            author: { '@type': 'Organization', name: 'Equipe Editorial Endinheirados', url: 'https://portalendinheirados.com.br/autor' },
            publisher: { '@type': 'Organization', name: 'Endinheirados', logo: { '@type': 'ImageObject', url: 'https://portalendinheirados.com.br/icon.png' } },
          }),
        }}
      />
    </article>
  )
}
