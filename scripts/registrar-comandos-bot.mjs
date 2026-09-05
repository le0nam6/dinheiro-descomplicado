/**
 * Registra o menu de comandos do bot no Telegram.
 *
 * O menu é estado guardado no lado do Telegram, não no código — por isso
 * precisa ser enviado uma vez por setMyCommands. Rode de novo sempre que
 * adicionar ou renomear um comando.
 *
 * Uso: node scripts/registrar-comandos-bot.mjs
 */
import { config } from 'dotenv'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

config({ path: resolve(dirname(fileURLToPath(import.meta.url)), '../.env.local') })

const TOKEN = process.env.TELEGRAM_BOT_TOKEN
if (!TOKEN) { console.error('TELEGRAM_BOT_TOKEN ausente no .env.local'); process.exit(1) }

const comandos = [
  { command: 'busca',    description: 'Relatório do Search Console (7, 28 ou 90 dias)' },
  { command: 'pautas',   description: 'Pautas sugeridas agora, sem esperar o cron' },
  { command: 'fila',     description: 'Pautas aprovadas aguardando publicação' },
  { command: 'cotacao',  description: 'Cotação de um ativo: /cotacao dolar' },
  { command: 'alertas',  description: 'Seus alertas de preço' },
]

const r = await fetch(`https://api.telegram.org/bot${TOKEN}/setMyCommands`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ commands: comandos }),
}).then(r => r.json())

if (r.ok) {
  console.log('\nMenu do bot atualizado:\n')
  for (const c of comandos) console.log(`  /${c.command.padEnd(9)} ${c.description}`)
  console.log('\nAbra o Telegram e toque no ícone de menu ao lado do campo de texto.\n')
} else {
  console.error('Falhou:', r.description)
  process.exit(1)
}
