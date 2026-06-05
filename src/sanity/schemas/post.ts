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
    defineField({ name: 'category', title: 'Categoria', type: 'string', options: { list: ['empréstimo', 'cartão de crédito', 'financiamento', 'investimentos', 'previdência', 'educação financeira'] } }),
    defineField({ name: 'excerpt', title: 'Resumo (meta description)', type: 'text', rows: 3, validation: r => r.required().max(160) }),
    defineField({ name: 'coverImage', title: 'Imagem de capa', type: 'object', fields: [
      { name: 'url', title: 'URL', type: 'url' },
      { name: 'alt', title: 'Alt text', type: 'string' },
      { name: 'credit', title: 'Crédito (Unsplash)', type: 'string' },
    ]}),
    defineField({ name: 'body', title: 'Conteúdo', type: 'array', of: [{ type: 'block' }, { type: 'image' }] }),
    defineField({ name: 'seoKeywords', title: 'Palavras-chave SEO', type: 'array', of: [{ type: 'string' }] }),
    defineField({ name: 'readingTime', title: 'Tempo de leitura (min)', type: 'number' }),
  ],
  preview: {
    select: { title: 'title', subtitle: 'funnel', media: 'coverImage' },
    prepare({ title, subtitle }) {
      const emoji = subtitle === 'tofu' ? '🟢' : subtitle === 'mofu' ? '🟡' : '🔴'
      return { title, subtitle: `${emoji} ${subtitle?.toUpperCase()}` }
    },
  },
})
