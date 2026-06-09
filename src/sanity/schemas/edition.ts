import { defineType, defineField } from 'sanity'

/**
 * Edição diária — o compilado curado do mercado (estilo "The News").
 * Publicada todo dia às 6h. No futuro vira newsletter.
 */
export const editionSchema = defineType({
  name: 'edition',
  title: 'Edição diária',
  type: 'document',
  fields: [
    defineField({ name: 'date', title: 'Data (YYYY-MM-DD)', type: 'string', validation: r => r.required() }),
    defineField({ name: 'slug', title: 'Slug', type: 'slug', options: { source: 'date' }, validation: r => r.required() }),
    defineField({ name: 'title', title: 'Título', type: 'string', validation: r => r.required() }),
    defineField({ name: 'publishedAt', title: 'Publicado em', type: 'datetime', validation: r => r.required() }),
    defineField({ name: 'punchline', title: 'Punchline (abertura impactante)', type: 'string', description: 'Frase curta, motivacional-informal, que dá o tapa inicial. Aparece no topo, em destaque.' }),
    defineField({ name: 'intro', title: 'Abertura', type: 'text', rows: 4, description: 'Frase de abertura com personalidade — o "bom dia" que prende o leitor.' }),
    defineField({ name: 'closing', title: 'Fecho', type: 'text', rows: 2, description: 'Frase final que amarra a edição.' }),
    defineField({ name: 'readingTime', title: 'Tempo de leitura (min)', type: 'number' }),
    defineField({
      name: 'stories', title: 'Matérias', type: 'array', of: [
        {
          type: 'object', name: 'story',
          fields: [
            { name: 'emoji', title: 'Emoji', type: 'string' },
            { name: 'tag', title: 'Editoria', type: 'string' },
            { name: 'headline', title: 'Manchete', type: 'string' },
            { name: 'hook', title: 'Gancho', type: 'string', description: 'Frase de abertura que fisgue o leitor antes dos fatos.' },
            { name: 'what', title: 'O que aconteceu', type: 'text', rows: 4 },
            { name: 'why', title: 'Por que importa', type: 'text', rows: 4 },
            { name: 'image', title: 'Foto', type: 'object', fields: [
              { name: 'url', title: 'URL', type: 'url' },
              { name: 'alt', title: 'Alt', type: 'string' },
              { name: 'credit', title: 'Crédito', type: 'string' },
            ] },
            { name: 'sources', title: 'Fontes', type: 'array', of: [
              { type: 'object', name: 'source', fields: [
                { name: 'name', title: 'Veículo', type: 'string' },
                { name: 'url', title: 'URL', type: 'url' },
              ], preview: { select: { title: 'name', subtitle: 'url' } } },
            ] },
          ],
          preview: { select: { title: 'headline', subtitle: 'tag' } },
        },
      ],
    }),
    defineField({
      name: 'wordOfDay', title: 'Palavra do dia', type: 'object', fields: [
        { name: 'word', title: 'Termo', type: 'string' },
        { name: 'meaning', title: 'O que significa', type: 'text', rows: 2 },
        { name: 'application', title: 'Aplicação (3 frases)', type: 'text', rows: 3 },
      ],
    }),
    defineField({ name: 'curiosity', title: 'Curiosidade do dia', type: 'text', rows: 3 }),
    defineField({ name: 'recommendation', title: 'Recomendação (sexta)', type: 'text', rows: 3, description: 'Série ou livro — só nas sextas.' }),
    defineField({ name: 'reflection', title: 'Reflexão (domingo)', type: 'text', rows: 3, description: 'Reflexão do dia — só aos domingos.' }),
    defineField({
      name: 'marketSnapshot', title: 'Termômetro do mercado', type: 'array', of: [
        { type: 'object', name: 'quote', fields: [
          { name: 'label', title: 'Ativo', type: 'string' },
          { name: 'value', title: 'Valor', type: 'string' },
          { name: 'changePct', title: 'Variação %', type: 'number' },
        ], preview: { select: { title: 'label', subtitle: 'value' } } },
      ],
    }),
  ],
  orderings: [{ name: 'dateDesc', title: 'Mais recentes', by: [{ field: 'date', direction: 'desc' }] }],
  preview: {
    select: { title: 'title', date: 'date' },
    prepare({ title, date }) { return { title, subtitle: `📰 ${date}` } },
  },
})
