import { defineType, defineField } from 'sanity'

export const editorialQueueSchema = defineType({
  name: 'editorialQueue',
  title: 'Fila editorial',
  type: 'document',
  fields: [
    defineField({
      name: 'kind',
      title: 'Tipo',
      type: 'string',
      options: {
        list: [
          { title: '📰 Notícia (tema)', value: 'noticia' },
          { title: '📝 Matéria própria', value: 'materia' },
          { title: '💡 Curiosidade', value: 'curiosidade' },
        ],
        layout: 'radio',
      },
      validation: r => r.required(),
    }),
    defineField({
      name: 'brief',
      title: 'Briefing / ideia',
      type: 'text',
      rows: 3,
      description: 'Descreva a pauta em texto livre. Vira a base do que o robô vai escrever.',
      validation: r => r.required(),
    }),
    defineField({
      name: 'priority',
      title: 'Prioridade',
      type: 'number',
      initialValue: 0,
      description: 'Maior = sai antes. Empate, vence o mais antigo.',
    }),
    defineField({
      name: 'status',
      title: 'Status',
      type: 'string',
      options: {
        list: [
          { title: '🟢 Na fila', value: 'fila' },
          { title: '✅ Usado', value: 'usado' },
          { title: '🗑 Descartado', value: 'descartado' },
        ],
        layout: 'radio',
      },
      initialValue: 'fila',
    }),
    defineField({ name: 'source', title: 'Origem', type: 'string', readOnly: true, description: 'telegram | admin' }),
    defineField({ name: 'createdAt', title: 'Criado em', type: 'datetime', readOnly: true }),
    defineField({ name: 'usedAt', title: 'Usado em', type: 'datetime', readOnly: true }),
    defineField({ name: 'usedRef', title: 'Resultado', type: 'string', readOnly: true, description: 'slug/título do post gerado' }),
  ],
  orderings: [
    { title: 'Prioridade', name: 'priorityDesc', by: [{ field: 'priority', direction: 'desc' }, { field: 'createdAt', direction: 'asc' }] },
  ],
  preview: {
    select: { title: 'brief', kind: 'kind', status: 'status' },
    prepare: ({ title, kind, status }) => ({
      title: (title || '(sem briefing)').slice(0, 60),
      subtitle: `${kind ?? '?'} · ${status ?? 'fila'}`,
    }),
  },
})
