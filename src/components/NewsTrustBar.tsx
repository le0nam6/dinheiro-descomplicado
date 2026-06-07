/**
 * Barra de confiança jornalística para notícias: selo de transparência + datas.
 */
export function NewsTrustBar({ publishedAt, updatedAt }: { publishedAt: string; updatedAt?: string }) {
  const fmt = (d: string) => new Date(d).toLocaleString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
  return (
    <div className="my-6 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-gray-500 border-y border-gray-100 py-3">
      <span className="inline-flex items-center gap-1.5 font-medium text-green-700">
        <span>✓</span> Produzido com auxílio de IA · fontes verificadas
      </span>
      <a href="/etica" className="underline hover:text-green-700">política editorial</a>
      <span className="text-gray-300">|</span>
      <span>Publicado em {fmt(publishedAt)}</span>
      {updatedAt && updatedAt !== publishedAt && (
        <span className="text-green-700">· Atualizado em {fmt(updatedAt)}</span>
      )}
    </div>
  )
}
