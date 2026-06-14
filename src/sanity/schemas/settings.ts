import { defineType, defineField } from 'sanity'

export const settingsSchema = defineType({
  name: 'siteSettings',
  title: 'Configurações do Site',
  type: 'document',
  fields: [
    defineField({ name: 'subscriberGoal', title: 'Meta de inscritos', type: 'number', initialValue: 100 }),
    defineField({ name: 'subscriberGoalReward', title: 'Recompensa ao bater a meta', type: 'string', initialValue: 'faremos uma live exclusiva de finanças ao vivo com Q&A' }),
    defineField({
      name: 'referralMilestones',
      title: 'Metas de indicação',
      type: 'array',
      of: [{
        type: 'object',
        name: 'milestone',
        title: 'Meta',
        fields: [
          { name: 'count',  title: 'Nº de indicações', type: 'number' },
          { name: 'emoji',  title: 'Emoji',            type: 'string' },
          { name: 'label',  title: 'Nome da meta',     type: 'string' },
          { name: 'reward', title: 'Recompensa',       type: 'string' },
        ],
        preview: {
          select: { title: 'label', subtitle: 'count' },
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          prepare: (s: any) => ({ title: s.title, subtitle: `${s.count} indicações` }),
        },
      }],
    }),
  ],
  preview: { select: { title: 'subscriberGoal' }, prepare: () => ({ title: 'Configurações do Site' }) },
})
