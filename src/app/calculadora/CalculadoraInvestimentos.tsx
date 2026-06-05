'use client'

import { useState, useMemo } from 'react'

const PRESETS = [
  { label: 'Poupança', rate: 6.17, color: 'bg-gray-400' },
  { label: 'Tesouro Selic', rate: 13.25, color: 'bg-emerald-500' },
  { label: 'CDB 110% CDI', rate: 14.58, color: 'bg-blue-500' },
  { label: 'LCI/LCA', rate: 11.96, color: 'bg-violet-500' },
]

function formatBRL(value: number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(value)
}

function calcular(aporte: number, mensal: number, taxaAnual: number, anos: number) {
  const meses = anos * 12
  const taxaMensal = (1 + taxaAnual / 100) ** (1 / 12) - 1
  let montante = aporte
  for (let i = 0; i < meses; i++) {
    montante = montante * (1 + taxaMensal) + mensal
  }
  const totalInvestido = aporte + mensal * meses
  const rendimento = montante - totalInvestido
  return { montante, totalInvestido, rendimento }
}

function calcularMensal(aporte: number, mensal: number, taxaAnual: number, anos: number) {
  const meses = anos * 12
  const taxaMensal = (1 + taxaAnual / 100) ** (1 / 12) - 1
  const pontos = []
  let saldo = aporte
  for (let i = 1; i <= meses; i++) {
    saldo = saldo * (1 + taxaMensal) + mensal
    if (i % 12 === 0) {
      const investido = aporte + mensal * i
      pontos.push({ ano: i / 12, saldo, investido, rendimento: saldo - investido })
    }
  }
  return pontos
}

export function CalculadoraInvestimentos() {
  const [aporte, setAporte] = useState(1000)
  const [mensal, setMensal] = useState(300)
  const [taxa, setTaxa] = useState(13.25)
  const [anos, setAnos] = useState(10)

  const resultado = useMemo(() => calcular(aporte, mensal, taxa, anos), [aporte, mensal, taxa, anos])
  const grafico = useMemo(() => calcularMensal(aporte, mensal, taxa, anos), [aporte, mensal, taxa, anos])
  const comparativo = useMemo(() => PRESETS.map(p => ({ ...p, ...calcular(aporte, mensal, p.rate, anos) })), [aporte, mensal, anos])

  const pct = resultado.montante > 0 ? (resultado.totalInvestido / resultado.montante) * 100 : 50
  const maxSaldo = Math.max(...grafico.map(p => p.saldo), 1)

  return (
    <div className="space-y-6">

      {/* Inputs */}
      <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
        <h2 className="text-lg font-bold text-gray-900 mb-5">Configure sua simulação</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Investimento inicial</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-medium text-sm">R$</span>
              <input type="number" min={0} value={aporte}
                onChange={e => setAporte(Math.max(0, Number(e.target.value)))}
                className="w-full pl-9 pr-4 py-3 border border-gray-200 rounded-xl text-gray-900 font-semibold focus:outline-none focus:ring-2 focus:ring-green-400 text-base" />
            </div>
            <input type="range" min={0} max={50000} step={500} value={aporte}
              onChange={e => setAporte(Number(e.target.value))}
              className="w-full mt-2 accent-green-500" />
            <div className="flex justify-between text-xs text-gray-400 mt-0.5"><span>R$0</span><span>R$50.000</span></div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Aporte mensal</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-medium text-sm">R$</span>
              <input type="number" min={0} value={mensal}
                onChange={e => setMensal(Math.max(0, Number(e.target.value)))}
                className="w-full pl-9 pr-4 py-3 border border-gray-200 rounded-xl text-gray-900 font-semibold focus:outline-none focus:ring-2 focus:ring-green-400 text-base" />
            </div>
            <input type="range" min={0} max={5000} step={50} value={mensal}
              onChange={e => setMensal(Number(e.target.value))}
              className="w-full mt-2 accent-green-500" />
            <div className="flex justify-between text-xs text-gray-400 mt-0.5"><span>R$0</span><span>R$5.000</span></div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Taxa de juros anual</label>
            <div className="relative">
              <input type="number" min={0.1} max={30} step={0.1} value={taxa}
                onChange={e => setTaxa(Math.max(0.1, Number(e.target.value)))}
                className="w-full pr-9 pl-4 py-3 border border-gray-200 rounded-xl text-gray-900 font-semibold focus:outline-none focus:ring-2 focus:ring-green-400 text-base" />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 font-medium text-sm">%</span>
            </div>
            <input type="range" min={1} max={25} step={0.25} value={taxa}
              onChange={e => setTaxa(Number(e.target.value))}
              className="w-full mt-2 accent-green-500" />
            <div className="flex gap-2 flex-wrap mt-2">
              {PRESETS.map(p => (
                <button key={p.label} onClick={() => setTaxa(p.rate)}
                  className={`text-xs px-2.5 py-1 rounded-full border font-medium transition-colors ${taxa === p.rate ? 'bg-green-600 text-white border-green-600' : 'border-gray-200 text-gray-600 hover:border-green-400'}`}>
                  {p.label} ({p.rate}%)
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Período</label>
            <div className="relative">
              <input type="number" min={1} max={40} value={anos}
                onChange={e => setAnos(Math.max(1, Math.min(40, Number(e.target.value))))}
                className="w-full pr-16 pl-4 py-3 border border-gray-200 rounded-xl text-gray-900 font-semibold focus:outline-none focus:ring-2 focus:ring-green-400 text-base" />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 font-medium text-sm">anos</span>
            </div>
            <input type="range" min={1} max={40} step={1} value={anos}
              onChange={e => setAnos(Number(e.target.value))}
              className="w-full mt-2 accent-green-500" />
            <div className="flex gap-2 mt-2">
              {[5, 10, 20, 30].map(a => (
                <button key={a} onClick={() => setAnos(a)}
                  className={`text-xs px-3 py-1 rounded-full border font-medium transition-colors ${anos === a ? 'bg-green-600 text-white border-green-600' : 'border-gray-200 text-gray-600 hover:border-green-400'}`}>
                  {a} anos
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Resultado principal */}
      <div className="bg-gradient-to-br from-green-700 to-emerald-600 rounded-2xl p-6 text-white shadow-lg">
        <p className="text-green-200 text-sm font-medium mb-1">Patrimônio final em {anos} anos</p>
        <p className="text-4xl md:text-5xl font-black mb-6 tracking-tight">{formatBRL(resultado.montante)}</p>

        <div className="w-full bg-white/20 rounded-full h-3 mb-3 overflow-hidden">
          <div className="bg-white h-3 rounded-full transition-all duration-500" style={{ width: `${Math.max(2, Math.min(98, pct))}%` }} />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="bg-white/10 rounded-xl p-4">
            <p className="text-green-200 text-xs font-medium mb-1">Total investido</p>
            <p className="text-xl font-bold">{formatBRL(resultado.totalInvestido)}</p>
            <p className="text-green-300 text-xs mt-0.5">{Math.round(pct)}% do total</p>
          </div>
          <div className="bg-white/10 rounded-xl p-4">
            <p className="text-green-200 text-xs font-medium mb-1">Rendimento</p>
            <p className="text-xl font-bold">{formatBRL(resultado.rendimento)}</p>
            <p className="text-green-300 text-xs mt-0.5">{Math.round(100 - pct)}% do total</p>
          </div>
        </div>
      </div>

      {/* Gráfico de evolução */}
      {grafico.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
          <h2 className="text-base font-bold text-gray-900 mb-5">Evolução ano a ano</h2>
          <div className="relative flex items-end gap-1.5" style={{ height: 160 }}>
            {grafico.map((p) => {
              const CHART_H = 152
              const hTotal = Math.max(4, (p.saldo / maxSaldo) * CHART_H)
              const hInvestido = Math.max(2, (p.investido / maxSaldo) * CHART_H)
              const hRendimento = Math.max(0, hTotal - hInvestido)
              const showLabel = p.ano % (anos <= 10 ? 1 : anos <= 20 ? 2 : 5) === 0
              return (
                <div key={p.ano} className="flex-1 flex flex-col justify-end items-stretch group relative" style={{ height: CHART_H }}>
                  <div className="absolute bottom-full mb-1 left-1/2 -translate-x-1/2 hidden group-hover:flex flex-col items-center bg-gray-900 text-white text-xs rounded-lg px-2 py-1.5 whitespace-nowrap z-10 pointer-events-none">
                    <span className="font-bold">{formatBRL(p.saldo)}</span>
                    <span className="text-gray-400">{p.ano}º ano</span>
                  </div>
                  <div className="w-full rounded-t-sm bg-emerald-400 transition-all duration-500" style={{ height: hRendimento }} />
                  <div className="w-full bg-emerald-800 transition-all duration-500" style={{ height: hInvestido }} />
                  {showLabel && (
                    <span className="text-[10px] text-gray-400 text-center absolute -bottom-5 left-0 right-0">{p.ano}a</span>
                  )}
                </div>
              )
            })}
          </div>
          <div className="flex gap-4 mt-8 text-xs text-gray-500">
            <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm bg-emerald-800 inline-block" />Investido</span>
            <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm bg-emerald-400 inline-block" />Rendimento</span>
          </div>
        </div>
      )}

      {/* Comparativo entre produtos */}
      <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
        <h2 className="text-base font-bold text-gray-900 mb-1">Compare com outros investimentos</h2>
        <p className="text-xs text-gray-400 mb-5">Mesmo aporte inicial e mensal, taxas de 2026 (antes do IR)</p>
        <div className="space-y-3">
          {comparativo.sort((a, b) => b.montante - a.montante).map((p, i) => {
            const maxM = comparativo[0]?.montante || 1
            const w = (p.montante / maxM) * 100
            return (
              <div key={p.label}>
                <div className="flex justify-between items-center mb-1">
                  <span className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                    {i === 0 && <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-bold">Melhor</span>}
                    {p.label}
                  </span>
                  <span className="text-sm font-bold text-gray-900">{formatBRL(p.montante)}</span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-2.5 overflow-hidden">
                  <div className={`h-2.5 rounded-full transition-all duration-700 ${p.color}`} style={{ width: `${w}%` }} />
                </div>
                <div className="flex justify-between text-xs text-gray-400 mt-0.5">
                  <span>{p.rate}% a.a.</span>
                  <span>+{formatBRL(p.rendimento)} de rendimento</span>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* CTA artigos */}
      <div className="bg-green-50 border border-green-200 rounded-2xl p-6">
        <p className="font-bold text-green-900 mb-3">Quer entender melhor cada investimento?</p>
        <div className="flex flex-wrap gap-2">
          <a href="/blog/tesouro-direto-como-investir" className="text-sm bg-white border border-green-300 text-green-800 px-3 py-1.5 rounded-full hover:bg-green-100 transition-colors font-medium">📈 Tesouro Direto</a>
          <a href="/blog/reserva-de-emergencia-como-montar" className="text-sm bg-white border border-green-300 text-green-800 px-3 py-1.5 rounded-full hover:bg-green-100 transition-colors font-medium">🛡️ Reserva de Emergência</a>
          <a href="/blog/juros-compostos-como-funcionam" className="text-sm bg-white border border-green-300 text-green-800 px-3 py-1.5 rounded-full hover:bg-green-100 transition-colors font-medium">📊 Juros Compostos</a>
        </div>
      </div>

    </div>
  )
}
