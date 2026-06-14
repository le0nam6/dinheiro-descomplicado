import { defineType, defineField } from 'sanity'

export const subscriberSchema = defineType({
  name: 'subscriber',
  title: 'Inscrito (Newsletter)',
  type: 'document',
  fields: [
    defineField({ name: 'email', title: 'E-mail', type: 'string', validation: r => r.required() }),
    defineField({ name: 'subscribedAt', title: 'Inscrito em', type: 'datetime' }),
    defineField({ name: 'referralCode', title: 'Código de indicação', type: 'string' }),
    defineField({ name: 'referralCount', title: 'Indicações confirmadas', type: 'number', initialValue: 0 }),
    defineField({ name: 'referredBy', title: 'Indicado por (código)', type: 'string' }),
  ],
  preview: {
    select: { title: 'email', subtitle: 'referralCount' },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    prepare(s: any) {
      return { title: s.title, subtitle: s.subtitle ? `${s.subtitle} indicação(ões)` : '' }
    },
  },
})
