'use client'

import { useState, useMemo } from 'react'

const PERFIS = [
  { label: 'INSS / Aposentado', rate: 1.66, maxMonths: 84 },
  { label: 'Servidor Federal', rate: 1.45, maxMonths: 96 },
  { label: 'CLT Privado', rate: 1.80, maxMonths: 48 },
]

function fmt(v: number) {
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 2 })
}

export function CalculadoraConsignado() {
  const [perfilIdx, setPerfilIdx] = useState(0)
  const [valor, setValor] = useState(5000)
  const [meses, setMeses] = useState(36)
  const [renda, setRenda] = useState(3000)

  const perfil = PERFIS[perfilIdx]
  const maxMeses = perfil.maxMonths

  const result = useMemo(() => {
    const i = perfil.rate / 100
    const parcela = valor * (i * Math.pow(1 + i, meses)) / (Math.pow(1 + i, meses) - 1)
    const totalPago = parcela * meses
    const totalJuros = totalPago - valor
    const margemDisp = renda * 0.35
    const cabe = parcela <= margemDisp
    const margemRestante = margemDisp - parcela
    return { parcela, totalPago, totalJuros, margemDisp, cabe, margemRestante }
  }, [valor, meses, perfil, renda])

  return (
    <div className="space-y-5">
      {/* Perfil */}
      <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
        <h2 className="font-bold text-gray-800 mb-3 text-sm">Seu perfil</h2>
        <div className="grid grid-cols-3 gap-2">
          {PERFIS.map((p, i) => (
            <button key={p.label} onClick={() => { setPerfilIdx(i); setMeses(Math.min(meses, p.maxMonths)) }}
              className={`text-xs font-semibold py-2 px-2 rounded-xl border transition-all ${i === perfilIdx ? 'bg-green-600 text-white border-green-600' : 'border-gray-200 text-gray-600 hover:border-green-400'}`}>
              {p.label}
            </button>
          ))}
        </div>
        <p className="text-xs text-gray-400 mt-2">Taxa: {perfil.rate}% a.m. · Prazo máx.: {perfil.maxMonths} meses</p>
      </div>

      {/* Inputs */}
      <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm space-y-4">
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1">Valor do empréstimo</label>
          <div className="relative"><span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">R$</span>
            <input type="number" min={500} max={200000} step={500} value={valor} onChange={e => setValor(+e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl text-gray-900 font-semibold focus:outline-none focus:ring-2 focus:ring-green-400" /></div>
          <input type="range" min={500} max={100000} step={500} value={valor} onChange={e => setValor(+e.target.value)} className="w-full mt-2 accent-green-500" />
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1">Prazo — {meses} meses</label>
          <input type="range" min={6} max={maxMeses} step={6} value={meses} onChange={e => setMeses(+e.target.value)} className="w-full accent-green-500" />
          <div className="flex justify-between text-xs text-gray-400 mt-0.5"><span>6</span><span>{maxMeses} meses</span></div>
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1">Sua renda líquida</label>
          <div className="relative"><span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">R$</span>
            <input type="number" min={800} step={100} value={renda} onChange={e => setRenda(+e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl text-gray-900 font-semibold focus:outline-none focus:ring-2 focus:ring-green-400" /></div>
        </div>
      </div>

      {/* Resultado */}
      <div className={`rounded-2xl p-5 shadow-sm border ${result.cabe ? 'bg-green-700 border-green-700' : 'bg-red-600 border-red-600'}`}>
        <p className="text-white/80 text-xs font-semibold mb-1">PARCELA MENSAL</p>
        <p className="text-4xl font-black text-white mb-4">{fmt(result.parcela)}</p>
        <div className="grid grid-cols-2 gap-3">
          {[
            { label: 'Total pago', value: fmt(result.totalPago) },
            { label: 'Juros totais', value: fmt(result.totalJuros) },
            { label: 'Margem (35%)', value: fmt(result.margemDisp) },
            { label: result.cabe ? 'Margem restante' : 'Excede em', value: fmt(Math.abs(result.margemRestante)) },
          ].map(({ label, value }) => (
            <div key={label} className="bg-white/10 rounded-xl p-3">
              <p className="text-white/70 text-xs">{label}</p>
              <p className="text-white font-bold text-sm">{value}</p>
            </div>
          ))}
        </div>
        <p className={`mt-4 text-sm font-bold ${result.cabe ? 'text-green-200' : 'text-red-200'}`}>
          {result.cabe ? `✓ Cabe no seu orçamento (ainda sobram ${fmt(result.margemRestante)} de margem)` : `✗ Parcela excede sua margem consignável. Reduza o valor ou aumente o prazo.`}
        </p>
      </div>

      <p className="text-xs text-gray-400 text-center">Simulação estimada. Consulte a instituição financeira para condições exatas.</p>
    </div>
  )
}
