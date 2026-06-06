/**
 * Busca uma foto relevante no Unsplash para um post financeiro.
 * Uso: node scripts/ig-fetch-photo.mjs --title "Título do post" --cats "categoria1,categoria2"
 * Saída: URL da foto (string)
 */
import { config } from 'dotenv'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
config({ path: resolve(__dirname, '../.env.local') })

const KEY = process.env.UNSPLASH_ACCESS_KEY

function arg(flag) {
  const i = process.argv.indexOf(flag)
  return i !== -1 ? process.argv[i + 1] : null
}

const title = arg('--title') || ''
const cats  = arg('--cats') || ''

// Mapeia tópicos financeiros em PT para termos de busca em EN
const TOPIC_MAP = {
  'fii': 'real estate buildings city',
  'fundo imobiliário': 'real estate buildings city',
  'tesouro': 'government treasury bonds finance',
  'selic': 'interest rates bank finance',
  'cdb': 'bank investment savings',
  'lci': 'bank investment savings',
  'lca': 'bank investment savings',
  'poupança': 'savings bank money',
  'cartão': 'credit card wallet payment',
  'crédito': 'credit card wallet payment',
  'score': 'credit score approval bank',
  'dívida': 'debt stress finance papers',
  'empréstimo': 'loan bank contract signing',
  'consignado': 'salary paycheck bank',
  'financiamento': 'house keys mortgage real estate',
  'imóvel': 'house keys real estate',
  'consórcio': 'group savings planning',
  'renda passiva': 'passive income investments growth',
  'investimento': 'investment growth chart money',
  'carteira': 'investment portfolio diversification',
  'ir': 'tax documents calculator',
  'imposto': 'tax documents calculator',
  'pgbl': 'retirement savings pension',
  'vgbl': 'retirement savings pension',
  'previdência': 'retirement savings pension',
  'reserva emergência': 'emergency savings jar money',
  'fgts': 'worker paycheck savings',
  'pix': 'mobile payment smartphone transfer',
  'juros compostos': 'compound interest growth exponential',
  'negativado': 'debt collection finance stress',
}

function getSearchQuery(title, cats) {
  const text = (title + ' ' + cats).toLowerCase()
  for (const [keyword, query] of Object.entries(TOPIC_MAP)) {
    if (text.includes(keyword)) return query
  }
  return 'personal finance money investment'
}

const query = getSearchQuery(title, cats)

const url = `https://api.unsplash.com/photos/random?query=${encodeURIComponent(query)}&orientation=squarish&content_filter=high`
const res = await fetch(url, { headers: { Authorization: `Client-ID ${KEY}` } })
const data = await res.json()

if (!data.urls?.regular) {
  console.error('❌ Unsplash não retornou foto:', JSON.stringify(data))
  process.exit(1)
}

// Retorna URL em alta resolução (1080px)
const photoUrl = data.urls.regular.replace('w=1080', 'w=1350') || data.urls.full
console.log(photoUrl)
