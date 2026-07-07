import { defineType, defineField } from 'sanity'

const storyFormats = [
  { title: 'Standard', value: 'standard' },
  { title: 'Brief (curto)', value: 'brief' },
  { title: 'Deep (aprofundado)', value: 'deep' },
  { title: 'Stat (dado em destaque)', value: 'stat' },
]

const storyBlockFields = [
  defineField({ name: 'format', title: 'Formato', type: 'string', options: { list: storyFormats }, initialValue: 'standard', validation: r => r.required() }),
  defineField({ name: 'emoji', title: 'Emoji', type: 'string' }),
  defineField({ name: 'tag', title: 'Editoria', type: 'string' }),
  defineField({ name: 'headline', title: 'Manchete', type: 'string' }),
  defineField({ name: 'sourceUrl', title: 'URL da fonte', type: 'url' }),
  defineField({ name: 'hook', title: 'Gancho', type: 'text', rows: 2 }),
  defineField({ name: 'what', title: 'O que aconteceu', type: 'text', rows: 3 }),
  defineField({ name: 'why', title: 'Por que importa', type: 'text', rows: 3 }),
  defineField({ name: 'deepStat', title: '[Deep] Dado em destaque', type: 'string' }),
  defineField({ name: 'deepImplication', title: '[Deep] Implicação prática', type: 'text', rows: 2 }),
  defineField({ name: 'deepQuote', title: '[Deep] Citação', type: 'text', rows: 2 }),
  defineField({ name: 'statNumber', title: '[Stat] O número', type: 'string', description: 'Ex: R$ 1,2 trilhão' }),
  defineField({ name: 'statLabel', title: '[Stat] O que significa', type: 'string' }),
  defineField({
    name: 'image', title: 'Foto', type: 'object', fields: [
      { name: 'url', title: 'URL', type: 'url' },
      { name: 'alt', title: 'Alt', type: 'string' },
      { name: 'credit', title: 'Crédito', type: 'string' },
    ],
  }),
]

export const editionSchema = defineType({
  name: 'edition',
  title: 'Edição diária',
  type: 'document',
  fields: [
    // ── Identificação ──────────────────────────────────────
    defineField({ name: 'date', title: 'Data (YYYY-MM-DD)', type: 'string', validation: r => r.required() }),
    defineField({ name: 'number', title: 'Número da edição', type: 'number' }),
    defineField({ name: 'slug', title: 'Slug', type: 'slug', options: { source: 'date' }, validation: r => r.required() }),
    defineField({ name: 'status', title: 'Status', type: 'string', options: { list: ['rascunho', 'agendado', 'enviado'] }, initialValue: 'rascunho' }),
    defineField({ name: 'publishedAt', title: 'Publicado em', type: 'datetime' }),

    // ── Abertura ───────────────────────────────────────────
    defineField({
      name: 'introOptions',
      title: 'Opções de abertura (geradas por IA)',
      type: 'array',
      of: [{
        type: 'object', name: 'introOption', title: 'Opção',
        fields: [
          defineField({ name: 'punchline', title: 'Punchline', type: 'string' }),
          defineField({ name: 'intro', title: 'Abertura', type: 'text', rows: 3 }),
        ],
        preview: { select: { title: 'punchline', subtitle: 'intro' } },
      }],
    }),
    defineField({ name: 'selectedIntroIndex', title: 'Intro escolhida (índice)', type: 'number' }),
    defineField({ name: 'title', title: 'Título temático', type: 'string' }),
    defineField({ name: 'punchline', title: 'Punchline (escolhida)', type: 'string' }),
    defineField({ name: 'intro', title: 'Abertura (escolhida)', type: 'text', rows: 4 }),
    defineField({ name: 'closing', title: 'Fecho', type: 'text', rows: 2 }),
    defineField({ name: 'readingTime', title: 'Tempo de leitura (min)', type: 'number' }),

    // ── Blocos da edição ───────────────────────────────────
    defineField({
      name: 'blocks',
      title: 'Blocos da edição',
      type: 'array',
      of: [
        {
          type: 'object', name: 'storyBlock', title: 'Matéria',
          fields: storyBlockFields,
          preview: { select: { title: 'headline', subtitle: 'format' } },
        },
        {
          type: 'object', name: 'headlinesBlock', title: 'Headlines',
          fields: [
            defineField({ name: 'sectionTitle', title: 'Título da seção', type: 'string', initialValue: 'Headlines pelo mundo' }),
            defineField({
              name: 'items', title: 'Headlines', type: 'array',
              of: [{
                type: 'object', name: 'headlineItem',
                fields: [
                  { name: 'emoji', title: 'Emoji', type: 'string' },
                  { name: 'headline', title: 'Manchete', type: 'string' },
                  { name: 'sourceUrl', title: 'URL da fonte', type: 'url' },
                ],
                preview: { select: { title: 'headline' } },
              }],
            }),
          ],
          preview: { select: { title: 'sectionTitle' }, prepare: (v: Record<string, string>) => ({ title: `📋 ${v.title || 'Headlines'}` }) },
        },
        {
          type: 'object', name: 'publiBlock', title: 'Publi / Patrocinado',
          fields: [
            defineField({ name: 'sponsor', title: 'Patrocinador', type: 'string' }),
            defineField({ name: 'logoUrl', title: 'Logo URL', type: 'url' }),
            defineField({ name: 'link', title: 'Link', type: 'url' }),
            defineField({ name: 'text', title: 'Texto do publi', type: 'text', rows: 3 }),
          ],
          preview: { select: { title: 'sponsor' }, prepare: (v: Record<string, string>) => ({ title: `💼 Publi — ${v.title || 'sem patrocinador'}` }) },
        },
        {
          type: 'object', name: 'marketBlock', title: 'Termômetro do mercado',
          fields: [
            defineField({
              name: 'items', title: 'Ativos', type: 'array',
              of: [{
                type: 'object', name: 'quote', title: 'Ativo',
                fields: [
                  { name: 'label', title: 'Ativo', type: 'string' },
                  { name: 'value', title: 'Valor', type: 'string' },
                  { name: 'changePct', title: 'Variação %', type: 'number' },
                ],
                preview: { select: { title: 'label', subtitle: 'value' } },
              }],
            }),
          ],
          preview: { prepare: () => ({ title: '📊 Termômetro do mercado' }) },
        },
        {
          type: 'object', name: 'curiosidadeBlock', title: 'Curiosidade do dia',
          fields: [
            defineField({ name: 'text', title: 'Curiosidade', type: 'text', rows: 3 }),
          ],
          preview: { select: { title: 'text' }, prepare: (v: Record<string, string>) => ({ title: `💡 ${v.title?.slice(0, 60) || 'Curiosidade'}` }) },
        },
        {
          type: 'object', name: 'palavraBlock', title: 'Palavra do dia',
          fields: [
            defineField({ name: 'word', title: 'Termo', type: 'string' }),
            defineField({ name: 'meaning', title: 'O que significa', type: 'text', rows: 2 }),
            defineField({ name: 'application', title: 'Aplicação prática', type: 'text', rows: 2 }),
          ],
          preview: { select: { title: 'word' }, prepare: (v: Record<string, string>) => ({ title: `📚 ${v.title || 'Palavra do dia'}` }) },
        },
        {
          type: 'object', name: 'featuredPostsBlock', title: 'Você também pode ler',
          fields: [
            defineField({
              name: 'posts', title: 'Posts', type: 'array',
              of: [{
                type: 'object', name: 'featuredPost',
                fields: [
                  { name: 'title', title: 'Título', type: 'string' },
                  { name: 'slug', title: 'Slug', type: 'string' },
                  { name: 'excerpt', title: 'Resumo', type: 'text', rows: 2 },
                  { name: 'category', title: 'Categoria', type: 'string' },
                ],
                preview: { select: { title: 'title' } },
              }],
            }),
          ],
          preview: { prepare: () => ({ title: '📖 Você também pode ler' }) },
        },
        {
          type: 'object', name: 'recomendacaoBlock', title: 'Recomendação (sexta)',
          fields: [
            defineField({ name: 'text', title: 'Recomendação', type: 'text', rows: 3 }),
          ],
          preview: { select: { title: 'text' }, prepare: (v: Record<string, string>) => ({ title: `🍿 ${v.title?.slice(0, 60) || 'Recomendação'}` }) },
        },
        {
          type: 'object', name: 'reflexaoBlock', title: 'Reflexão (domingo)',
          fields: [
            defineField({ name: 'text', title: 'Reflexão', type: 'text', rows: 3 }),
          ],
          preview: { select: { title: 'text' }, prepare: (v: Record<string, string>) => ({ title: `🌅 ${v.title?.slice(0, 60) || 'Reflexão'}` }) },
        },
      ],
    }),

    // ── Campos legados (edições anteriores ao novo builder) ─
    defineField({
      name: 'stories', title: '(Legado) Matérias', type: 'array', of: [{
        type: 'object', name: 'story',
        fields: [
          { name: 'emoji', title: 'Emoji', type: 'string' },
          { name: 'tag', title: 'Editoria', type: 'string' },
          { name: 'headline', title: 'Manchete', type: 'string' },
          { name: 'hook', title: 'Gancho', type: 'string' },
          { name: 'what', title: 'O que aconteceu', type: 'text', rows: 4 },
          { name: 'why', title: 'Por que importa', type: 'text', rows: 4 },
          { name: 'image', title: 'Foto', type: 'object', fields: [
            { name: 'url', title: 'URL', type: 'url' },
            { name: 'alt', title: 'Alt', type: 'string' },
            { name: 'credit', title: 'Crédito', type: 'string' },
          ] },
        ],
        preview: { select: { title: 'headline', subtitle: 'tag' } },
      }],
    }),
    defineField({ name: 'wordOfDay', title: '(Legado) Palavra do dia', type: 'object', fields: [
      { name: 'word', type: 'string' },
      { name: 'meaning', type: 'text', rows: 2 },
      { name: 'application', type: 'text', rows: 3 },
    ] }),
    defineField({ name: 'curiosity', title: '(Legado) Curiosidade', type: 'text', rows: 3 }),
    defineField({ name: 'recommendation', title: '(Legado) Recomendação', type: 'text', rows: 3 }),
    defineField({ name: 'reflection', title: '(Legado) Reflexão', type: 'text', rows: 3 }),
    defineField({
      name: 'marketSnapshot', title: '(Legado) Termômetro do mercado', type: 'array', of: [
        { type: 'object', name: 'quote', fields: [
          { name: 'label', type: 'string' },
          { name: 'value', type: 'string' },
          { name: 'changePct', type: 'number' },
        ] },
      ],
    }),
    defineField({ name: 'featuredPosts', title: '(Legado) Posts em destaque', type: 'array', of: [
      { type: 'object', name: 'featuredPost', fields: [
        { name: 'title', type: 'string' },
        { name: 'slug', type: 'string' },
        { name: 'excerpt', type: 'text', rows: 2 },
        { name: 'category', type: 'string' },
      ] },
    ] }),
  ],
  orderings: [{ name: 'dateDesc', title: 'Mais recentes', by: [{ field: 'date', direction: 'desc' }] }],
  preview: {
    select: { title: 'title', date: 'date', status: 'status' },
    prepare(v: Record<string, string>) { const { title, date, status } = v
      const icon = status === 'enviado' ? '✅' : status === 'agendado' ? '🗓' : '✏️'
      return { title: title || `Edição ${date}`, subtitle: `${icon} ${date}` }
    },
  },
})
