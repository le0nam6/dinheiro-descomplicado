/**
 * Retorna o tipo de conteúdo a publicar baseado no horário atual.
 * Uso: node scripts/get-schedule.mjs
 * Saída: JSON { type, funnel, hour, day }
 *
 * Calendário:
 *   9h  → notícia quente (TOFU)
 *  12h  → evergreen (funil rotativo)
 *  15h  → notícia quente (TOFU)
 *  18h  → evergreen (funil rotativo)
 *
 * Funil evergreen por dia da semana:
 *   Dom 0: 12h=tofu  18h=mofu
 *   Seg 1: 12h=mofu  18h=bofu
 *   Ter 2: 12h=bofu  18h=tofu
 *   Qua 3: 12h=tofu  18h=mofu
 *   Qui 4: 12h=mofu  18h=bofu
 *   Sex 5: 12h=bofu  18h=tofu
 *   Sáb 6: 12h=tofu  18h=mofu
 */

const EVERGREEN_CALENDAR = {
  // [dia][hora] → funil
  0: { 12: 'tofu', 18: 'mofu' },
  1: { 12: 'mofu', 18: 'bofu' },
  2: { 12: 'bofu', 18: 'tofu' },
  3: { 12: 'tofu', 18: 'mofu' },
  4: { 12: 'mofu', 18: 'bofu' },
  5: { 12: 'bofu', 18: 'tofu' },
  6: { 12: 'tofu', 18: 'mofu' },
}

// Temas sugeridos por funil para guiar a IA
const TOPIC_BANK = {
  tofu: [
    'O que é e como funciona a Selic — e por que isso mexe com o seu bolso',
    'Inflação: o que é, como afeta o seu dinheiro e o que fazer',
    'Educação financeira básica que a escola nunca te ensinou',
    'Como o Nubank e os bancos digitais mudaram o mercado financeiro',
    'Poupança ainda vale a pena? A resposta direta que você precisava',
    'O que é CDI e por que ele aparece em todo investimento',
  ],
  mofu: [
    'CDB vs Tesouro Direto: qual rende mais e quando escolher cada um',
    'Como montar um orçamento que realmente funciona (sem planilha complicada)',
    'Renda fixa vs renda variável: qual faz mais sentido pra você agora',
    'Como e quando sair das dívidas — plano passo a passo',
    'Score de crédito: o que realmente influencia e como aumentar rápido',
    'Previdência privada vs Tesouro Direto: qual é melhor pra aposentar',
  ],
  bofu: [
    'Melhores CDBs disponíveis agora — ranking atualizado com rendimentos',
    'Cartões de crédito com cashback que valem a pena em 2026',
    'Melhores contas digitais de 2026: comparativo completo',
    'FIIs para começar: os fundos imobiliários mais indicados para iniciantes',
    'Onde investir R$ 500, R$ 1.000 e R$ 5.000 hoje — comparativo prático',
    'Empréstimo pessoal: onde encontrar as menores taxas em 2026',
  ],
}

const now = new Date()
const hour = now.getHours()
const day = now.getDay()

let type, funnel

if (hour === 9 || hour === 15) {
  type = 'news'
  funnel = 'tofu'
} else if (hour === 12 || hour === 18) {
  type = 'evergreen'
  funnel = EVERGREEN_CALENDAR[day][hour]
} else {
  // fallback para qualquer outro horário
  type = 'evergreen'
  funnel = 'mofu'
}

const suggestedTopics = TOPIC_BANK[funnel]

console.log(JSON.stringify({ type, funnel, hour, day, suggestedTopics }))
