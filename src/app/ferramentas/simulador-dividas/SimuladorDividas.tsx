'use client'

import { useState, useMemo } from 'react'

type Divida = { id: number; nome: string; saldo: number; taxa: number; parcela: number }

function fmt(v: number) { return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }) }

type SimResult = { meses: number; totalJuros: number; impossivel?: boolean }

function simular(dividas: Divida[], extra: number, estrategia: 'avalanche' | 'bola-de-neve'): SimResult {
  let lista = dividas.map(d => ({ ...d }))
  let meses = 0, totalJuros = 0

  while (lista.some(d => d.saldo > 0.01)) {
    meses++

    // Detecta cedo se a dívida total está crescendo (impossível quitar)
    const jurosMes = lista.reduce((s, d) => s + (d.saldo > 0 ? d.saldo * d.taxa / 100 : 0), 0)
    const pagamentosMes = lista.reduce((s, d) => s + (d.saldo > 0 ? Math.min(d.parcela, d.saldo) : 0), 0) + extra
    if (meses > 12 && jurosMes >= pagamentosMes) return { meses: 0, totalJuros: 0, impossivel: true }
    if (meses > 600) return { meses: 0, totalJuros: 0, impossivel: true }

    // Aplica juros
    lista.forEach(d => {
      if (d.saldo > 0) { const j = d.saldo * d.taxa / 100; totalJuros += j; d.saldo += j }
    })

    // Paga parcelas mínimas
    lista.forEach(d => {
      if (d.saldo > 0) { d.saldo = Math.max(0, d.saldo - Math.min(d.parcela, d.saldo)) }
    })

    // Aplica extra em cascata na ordem de prioridade
    const prioridade = lista
      .filter(d => d.saldo > 0.01)
      .sort(estrategia === 'avalanche'
        ? (a, b) => b.taxa - a.taxa
        : (a, b) => a.saldo - b.saldo)

    let extraDisp = extra
    for (const alvo of prioridade) {
      if (extraDisp <= 0) break
      const idx = lista.findIndex(d => d.id === alvo.id)
      const pg = Math.min(extraDisp, lista[idx].saldo)
      lista[idx].saldo = Math.max(0, lista[idx].saldo - pg)
      extraDisp -= pg
    }
  }

  return { meses, totalJuros }
}

export function SimuladorDividas() {
  const [dividas, setDividas] = useState<Divida[]>([
    { id: 1, nome: 'Cartão de crédito', saldo: 5000, taxa: 15, parcela: 500 },
    { id: 2, nome: 'Cheque especial', saldo: 2000, taxa: 8, parcela: 200 },
  ])
  const [extra, setExtra] = useState(300)
  const [nextId, setNextId] = useState(3)

  const addDivida = () => {
    setDividas(d => [...d, { id: nextId, nome: `Dívida ${nextId}`, saldo: 1000, taxa: 5, parcela: 100 }])
    setNextId(n => n + 1)
  }

  const update = (id: number, field: keyof Divida, val: string | number) =>
    setDividas(d => d.map(x => x.id === id ? { ...x, [field]: field === 'nome' ? val : +val } : x))

  const remove = (id: number) => setDividas(d => d.filter(x => x.id !== id))

  const { aval, bola } = useMemo(() => {
    if (!dividas.length) return { aval: null, bola: null }
    return { aval: simular(dividas, extra, 'avalanche'), bola: simular(dividas, extra, 'bola-de-neve') }
  }, [dividas, extra])

  const totalSaldo = dividas.reduce((s, d) => s + d.saldo, 0)
  const melhor = aval && bola ? (aval.totalJuros <= bola.totalJuros ? 'avalanche' : 'bola-de-neve') : null

  return (
    <div className="space-y-5">
      {/* Dívidas */}
      <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-bold text-gray-800 text-sm">Suas dívidas</h2>
          <button onClick={addDivida} className="text-xs font-semibold text-green-700 border border-green-300 px-3 py-1 rounded-lg hover:bg-green-50">+ Adicionar</button>
        </div>
        <div className="space-y-3">
          {dividas.map(d => (
            <div key={d.id} className="grid grid-cols-[1fr_64px_52px_64px_24px] gap-1.5 items-center">
              <input value={d.nome} onChange={e => update(d.id, 'nome', e.target.value)} className="min-w-0 text-xs border border-gray-200 rounded-lg px-2 py-1.5 w-full" placeholder="Nome" />
              <div className="relative min-w-0"><span className="absolute left-1.5 top-1/2 -translate-y-1/2 text-gray-400 text-[10px]">R$</span>
                <input type="number" value={d.saldo} onChange={e => update(d.id, 'saldo', e.target.value)} className="min-w-0 text-xs border border-gray-200 rounded-lg pl-5 pr-1 py-1.5 w-full" /></div>
              <div className="relative min-w-0"><input type="number" value={d.taxa} onChange={e => update(d.id, 'taxa', e.target.value)} className="min-w-0 text-xs border border-gray-200 rounded-lg pl-2 pr-4 py-1.5 w-full" />
                <span className="absolute right-1.5 top-1/2 -translate-y-1/2 text-gray-400 text-[10px]">%</span></div>
              <div className="relative min-w-0"><span className="absolute left-1.5 top-1/2 -translate-y-1/2 text-gray-400 text-[10px]">R$</span>
                <input type="number" value={d.parcela} onChange={e => update(d.id, 'parcela', e.target.value)} className="min-w-0 text-xs border border-gray-200 rounded-lg pl-5 pr-1 py-1.5 w-full" /></div>
              <button onClick={() => remove(d.id)} className="text-gray-300 hover:text-red-500 text-lg leading-none">×</button>
            </div>
          ))}
          <div className="grid grid-cols-[1fr_64px_52px_64px_24px] gap-1.5 text-[10px] text-gray-400 px-1">
            <span>Nome</span><span>Saldo</span><span>Taxa/mês</span><span>Parcela</span><span></span>
          </div>
        </div>
      </div>

      {/* Extra */}
      <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
        <label className="block text-sm font-semibold text-gray-700 mb-2">Valor extra para quitar dívidas por mês</label>
        <div className="relative"><span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">R$</span>
          <input type="number" min={0} step={50} value={extra} onChange={e => setExtra(+e.target.value)} className="w-full pl-9 py-2.5 border border-gray-200 rounded-xl text-gray-900 font-semibold focus:outline-none focus:ring-2 focus:ring-green-400" /></div>
        <input type="range" min={0} max={3000} step={50} value={extra} onChange={e => setExtra(+e.target.value)} className="w-full mt-2 accent-green-500" />
      </div>

      {/* Explicação das estratégias */}
      <div className="bg-blue-50 border border-blue-100 rounded-2xl p-5 space-y-3">
        <p className="text-xs font-bold text-blue-800 uppercase tracking-wide">Como funcionam as estratégias?</p>
        <div className="flex gap-3">
          <span className="text-xl">🌊</span>
          <div>
            <p className="text-sm font-semibold text-gray-800">Avalanche — maior juro primeiro</p>
            <p className="text-xs text-gray-500 leading-relaxed">Você paga o mínimo em todas as dívidas e coloca o dinheiro extra na que cobra mais juros. Matematicamente é a mais eficiente: você paga menos juros no total.</p>
          </div>
        </div>
        <div className="flex gap-3">
          <span className="text-xl">⛄</span>
          <div>
            <p className="text-sm font-semibold text-gray-800">Bola de Neve — menor saldo primeiro</p>
            <p className="text-xs text-gray-500 leading-relaxed">Você foca no valor mais baixo primeiro. Quita uma dívida rápido, ganha motivação e usa o dinheiro liberado pra atacar a próxima. Pode custar mais em juros, mas funciona melhor pra quem precisa de resultados rápidos pra não desistir.</p>
          </div>
        </div>
      </div>

      {/* Resultados */}
      {aval && bola && (
        <div className="grid grid-cols-2 gap-4">
          {([['avalanche', aval, '🌊', 'Maior juro primeiro'] , ['bola-de-neve', bola, '⛄', 'Menor saldo primeiro']] as const).map(([nome, res, emoji, desc]) => (
            <div key={nome} className={`rounded-2xl p-5 border-2 transition-all ${res.impossivel ? 'border-red-200 bg-red-50' : melhor === nome ? 'border-green-500 bg-green-50' : 'border-gray-200 bg-white'}`}>
              <div className="text-2xl mb-1">{emoji}</div>
              <p className="font-bold text-gray-900 text-sm capitalize">{nome === 'avalanche' ? 'Avalanche' : 'Bola de Neve'}</p>
              <p className="text-xs text-gray-500 mb-3">{desc}</p>
              {res.impossivel ? (
                <>
                  <p className="text-lg font-black text-red-600">Impossível quitar</p>
                  <p className="text-xs text-red-400 mt-1">Os juros superam os pagamentos mensais. Aumente o valor extra ou a parcela mínima.</p>
                </>
              ) : (
                <>
                  <p className="text-2xl font-black text-gray-900">{res.meses} meses</p>
                  <p className="text-xs text-gray-500">para quitar tudo</p>
                  <p className="font-bold text-red-600 mt-2 text-sm">{fmt(res.totalJuros)} em juros</p>
                  {melhor === nome && <span className="inline-block mt-2 text-xs font-bold text-green-700 bg-green-100 px-2 py-0.5 rounded-full">✓ Melhor opção</span>}
                </>
              )}
            </div>
          ))}
        </div>
      )}

      {aval && bola && !aval.impossivel && !bola.impossivel && melhor && (
        <div className="bg-gray-900 text-white rounded-2xl p-5 text-sm">
          <p className="font-bold mb-1">💡 Análise</p>
          <p className="text-gray-300">
            A estratégia <strong className="text-white">{melhor === 'avalanche' ? 'Avalanche' : 'Bola de Neve'}</strong> economiza{' '}
            <strong className="text-green-400">{fmt(Math.abs(aval.totalJuros - bola.totalJuros))}</strong> em juros e quita{' '}
            {Math.abs(aval.meses - bola.meses)} meses antes. Total da dívida atual: <strong className="text-white">{fmt(totalSaldo)}</strong>.
          </p>
        </div>
      )}
      {aval && bola && (aval.impossivel || bola.impossivel) && (
        <div className="bg-red-900 text-white rounded-2xl p-5 text-sm">
          <p className="font-bold mb-1">⚠️ Atenção</p>
          <p className="text-red-200">
            {aval.impossivel && bola.impossivel
              ? 'Com os pagamentos atuais, as dívidas nunca serão quitadas — os juros superam tudo que está sendo pago. Aumente o valor extra ou negocie taxas menores.'
              : `A estratégia ${aval.impossivel ? 'Avalanche' : 'Bola de Neve'} não consegue quitar as dívidas pois os juros superam os pagamentos enquanto foca em outra dívida. Use a outra estratégia ou aumente o valor extra.`
            }
          </p>
        </div>
      )}

      <p className="text-xs text-gray-400 text-center">Simulação estimada. As taxas reais podem variar conforme o contrato.</p>
    </div>
  )
}
