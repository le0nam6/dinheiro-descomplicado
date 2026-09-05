import { defineField, defineType } from 'sanity'

/**
 * Pauta sugerida pelo cron de pesquisa, aguardando decisão do editor.
 *
 * Existe como documento porque o botão do Telegram precisa de um id curto no
 * callback_data — o termo em si não cabe e pode conter ":", que é o separador.
 * Também deixa histórico do que foi sugerido e recusado, que é o que permite
 * ajustar os pesos de relevância com base em decisão real.
 */
export default defineType({
  name: 'pautaSugerida',
  title: 'Pauta sugerida',
  type: 'document',
  fields: [
    defineField({ name: 'termo', title: 'Termo', type: 'string', validation: r => r.required() }),
    defineField({ name: 'nota', title: 'Nota de relevância', type: 'number' }),
    defineField({ name: 'porque', title: 'Justificativa', type: 'text', rows: 2 }),
    defineField({
      name: 'origem', title: 'Origem', type: 'string',
      options: { list: ['search-console', 'busca-relacionada', 'editor'] },
    }),
    defineField({ name: 'fatores', title: 'Fatores da nota', type: 'object', fields: [
      { name: 'proximidade', type: 'number' },
      { name: 'demanda', type: 'number' },
      { name: 'durabilidade', type: 'number' },
      { name: 'lacuna', type: 'number' },
      { name: 'encaixe', type: 'number' },
    ] }),
    defineField({
      name: 'status', title: 'Status', type: 'string',
      options: { list: ['sugerida', 'aprovada', 'recusada'] },
      initialValue: 'sugerida',
    }),
    defineField({ name: 'createdAt', title: 'Sugerida em', type: 'datetime' }),
    defineField({ name: 'decididaEm', title: 'Decidida em', type: 'datetime' }),
  ],
  preview: {
    select: { title: 'termo', subtitle: 'porque', nota: 'nota' },
    prepare: ({ title, subtitle, nota }) => ({ title: `${nota ?? '–'} · ${title}`, subtitle }),
  },
})
