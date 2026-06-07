import { defineType, defineField } from 'sanity'

export const commentSchema = defineType({
  name: 'comment',
  title: 'Comentário',
  type: 'document',
  fields: [
    defineField({ name: 'name', title: 'Nome', type: 'string', validation: r => r.required() }),
    defineField({ name: 'body', title: 'Comentário', type: 'text', rows: 4, validation: r => r.required() }),
    defineField({ name: 'slug', title: 'Slug do post', type: 'string', validation: r => r.required() }),
    defineField({ name: 'createdAt', title: 'Criado em', type: 'datetime' }),
    defineField({ name: 'approved', title: 'Aprovado', type: 'boolean', initialValue: true }),
  ],
  orderings: [{ title: 'Mais recentes', name: 'recent', by: [{ field: 'createdAt', direction: 'desc' }] }],
  preview: {
    select: { title: 'name', subtitle: 'body', approved: 'approved' },
    prepare: ({ title, subtitle, approved }) => ({ title: `${approved ? '' : '⏳ '}${title}`, subtitle }),
  },
})
