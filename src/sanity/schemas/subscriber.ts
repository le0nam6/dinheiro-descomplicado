import { defineType, defineField } from 'sanity'

export const subscriberSchema = defineType({
  name: 'subscriber',
  title: 'Inscrito (Newsletter)',
  type: 'document',
  fields: [
    defineField({ name: 'email', title: 'E-mail', type: 'string', validation: r => r.required() }),
    defineField({ name: 'subscribedAt', title: 'Inscrito em', type: 'datetime' }),
  ],
  preview: {
    select: { title: 'email', subtitle: 'subscribedAt' },
  },
})
