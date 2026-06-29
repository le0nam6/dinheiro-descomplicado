/**
 * Barra de confiança jornalística para notícias: selo de transparência + datas.
 */
import { IconShieldCheck, IconClock } from '@tabler/icons-react'

export function NewsTrustBar({ publishedAt, updatedAt }: { publishedAt: string; updatedAt?: string }) {
  const fmt = (d: string) => new Date(d).toLocaleString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
  return (
    <div className="my-8 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-gray-500 border-y border-gray-100 py-4">
      <span className="inline-flex items-center gap-1.5 font-medium text-green-700">
        <IconShieldCheck size={16} stroke={1.75} /> Redação Endinheirados · fontes verificadas
      </span>
      <a href="/etica" className="underline hover:text-green-700">política editorial</a>
      <span className="text-gray-300">|</span>
      <span className="inline-flex items-center gap-1.5">
        <IconClock size={14} stroke={1.75} /> Publicado em {fmt(publishedAt)}
      </span>
      {updatedAt && updatedAt !== publishedAt && (
        <span className="text-green-700">· Atualizado em {fmt(updatedAt)}</span>
      )}
    </div>
  )
}
