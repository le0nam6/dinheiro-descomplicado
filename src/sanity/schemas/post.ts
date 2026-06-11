import { defineType, defineField } from 'sanity'

export const postSchema = defineType({
  name: 'post',
  title: 'Post',
  type: 'document',
  fields: [
    defineField({ name: 'title', title: 'Título', type: 'string', validation: r => r.required() }),
    defineField({ name: 'slug', title: 'Slug', type: 'slug', options: { source: 'title' }, validation: r => r.required() }),
    defineField({ name: 'publishedAt', title: 'Publicado em', type: 'datetime', validation: r => r.required() }),
    defineField({ name: 'funnel', title: 'Funil', type: 'string', options: { list: ['tofu', 'mofu', 'bofu'] }, validation: r => r.required() }),
    defineField({ name: 'category', title: 'Categoria', type: 'string', options: { list: ['ganhar dinheiro', 'empréstimo', 'cartão de crédito', 'financiamento', 'investimentos', 'previdência', 'educação financeira'] } }),
    defineField({ name: 'excerpt', title: 'Resumo (meta description)', type: 'text', rows: 3, validation: r => r.required().max(160) }),
    defineField({ name: 'coverImage', title: 'Imagem de capa', type: 'object', fields: [
      { name: 'url', title: 'URL', type: 'url' },
      { name: 'alt', title: 'Alt text', type: 'string' },
      { name: 'credit', title: 'Crédito (Unsplash)', type: 'string' },
    ]}),
    defineField({ name: 'body', title: 'Conteúdo', type: 'array', of: [
      { type: 'block' },
      { type: 'image' },
      {
        type: 'object',
        name: 'table',
        title: 'Tabela',
        fields: [
          { name: 'rows', title: 'Linhas', type: 'array', of: [
            { type: 'object', name: 'row', fields: [
              { name: 'cells', title: 'Células', type: 'array', of: [{ type: 'string' }] },
            ]},
          ]},
        ],
        preview: { select: { rows: 'rows' }, prepare: ({ rows }) => ({ title: `Tabela (${rows?.length || 0} linhas)` }) },
      },
    ] }),
    defineField({ name: 'seoKeywords', title: 'Palavras-chave SEO', type: 'array', of: [{ type: 'string' }] }),
    defineField({ name: 'readingTime', title: 'Tempo de leitura (min)', type: 'number' }),
    defineField({ name: 'igPublished', title: 'Publicado no Instagram', type: 'boolean' }),
    defineField({ name: 'igPostId', title: 'ID do post no Instagram', type: 'string' }),
    defineField({ name: 'articleType', title: 'Tipo de artigo', type: 'string', options: { list: ['evergreen', 'news'] }, initialValue: 'evergreen' }),
    defineField({ name: 'updatedAt', title: 'Atualizado em', type: 'datetime' }),
    defineField({ name: 'sponsored', title: 'Conteúdo patrocinado', type: 'boolean', initialValue: false }),
    defineField({ name: 'sponsorName', title: 'Patrocinador', type: 'string' }),
    defineField({ name: 'sources', title: 'Fontes (notícias)', type: 'array', of: [
      { type: 'object', name: 'source', fields: [
        { name: 'name', title: 'Veículo', type: 'string' },
        { name: 'url', title: 'URL', type: 'url' },
      ], preview: { select: { title: 'name', subtitle: 'url' } } },
    ] }),
  ],
  preview: {
    select: { title: 'title', subtitle: 'funnel', media: 'coverImage' },
    prepare({ title, subtitle }) {
      const emoji = subtitle === 'tofu' ? '🟢' : subtitle === 'mofu' ? '🟡' : '🔴'
      return { title, subtitle: `${emoji} ${subtitle?.toUpperCase()}` }
    },
  },
})
