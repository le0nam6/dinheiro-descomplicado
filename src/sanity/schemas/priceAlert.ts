import { defineType, defineField } from 'sanity'

export const priceAlertSchema = defineType({
  name: 'priceAlert',
  title: 'Alerta de cotação',
  type: 'document',
  fields: [
    defineField({
      name: 'symbol', title: 'Ativo', type: 'string',
      options: { list: [
        { title: 'Dólar', value: 'USDBRL' }, { title: 'Euro', value: 'EURBRL' }, { title: 'Libra', value: 'GBPBRL' },
        { title: 'Bitcoin', value: 'BTCBRL' }, { title: 'Ethereum', value: 'ETHBRL' },
        { title: 'Ibovespa', value: '^BVSP' }, { title: 'S&P 500', value: '^GSPC' },
        { title: 'Nasdaq', value: '^IXIC' }, { title: 'Dow Jones', value: '^DJI' },
      ] },
      validation: r => r.required(),
    }),
    defineField({ name: 'condition', title: 'Condição', type: 'string', options: { list: [
      { title: 'Acima de', value: 'above' }, { title: 'Abaixo de', value: 'below' },
    ] }, validation: r => r.required() }),
    defineField({ name: 'value', title: 'Valor', type: 'number', validation: r => r.required() }),
    defineField({ name: 'active', title: 'Ativo', type: 'boolean', initialValue: true }),
    defineField({ name: 'lastTriggeredAt', title: 'Último disparo', type: 'datetime', readOnly: true }),
  ],
  preview: {
    select: { symbol: 'symbol', condition: 'condition', value: 'value', active: 'active' },
    prepare: ({ symbol, condition, value, active }) => ({
      title: `${symbol} ${condition === 'above' ? '>' : '<'} ${value}`,
      subtitle: active ? 'ativo' : 'inativo',
    }),
  },
})
