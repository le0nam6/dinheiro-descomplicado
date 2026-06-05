// Validador de e-mail robusto com sugestão de domínio e checagem de nomes completos

const TYPOS: Record<string, string> = {
  'gmai.com': 'gmail.com', 'gmial.com': 'gmail.com', 'gmail.co': 'gmail.com',
  'hotmai.com': 'hotmail.com', 'hotmial.com': 'hotmail.com',
  'outlok.com': 'outlook.com', 'outloo.com': 'outlook.com',
  'yaho.com': 'yahoo.com', 'yahooo.com': 'yahoo.com',
  'iclod.com': 'icloud.com',
}

export function validateEmail(email: string): { valid: boolean; error?: string; suggestion?: string } {
  const trimmed = email.trim().toLowerCase()
  if (!trimmed) return { valid: false, error: 'Informe seu e-mail.' }
  if (!trimmed.includes('@')) return { valid: false, error: 'E-mail inválido — faltou o @.' }
  const parts = trimmed.split('@')
  if (parts.length !== 2) return { valid: false, error: 'E-mail inválido.' }
  const [local, domain] = parts
  if (local.length < 1) return { valid: false, error: 'E-mail inválido.' }
  if (!domain.includes('.')) return { valid: false, error: 'Domínio inválido.' }
  if (domain.endsWith('.')) return { valid: false, error: 'Domínio inválido.' }
  const fakePatterns = [/^test@/, /^fake@/, /^xxx@/, /^aaa@/, /^123@/, /asdf/, /qwerty/]
  if (fakePatterns.some(p => p.test(trimmed))) return { valid: false, error: 'Use um e-mail válido para acessar.' }
  if (TYPOS[domain]) return { valid: false, error: '', suggestion: `${local}@${TYPOS[domain]}` }
  const re = /^[a-z0-9._%+\-]+@[a-z0-9.\-]+\.[a-z]{2,}$/
  if (!re.test(trimmed)) return { valid: false, error: 'Formato de e-mail inválido.' }
  return { valid: true }
}

export function validateName(name: string): { valid: boolean; error?: string } {
  const trimmed = name.trim()
  if (!trimmed) return { valid: false, error: 'Informe seu nome completo.' }
  if (trimmed.length < 3) return { valid: false, error: 'Nome muito curto.' }
  const words = trimmed.split(/\s+/).filter(Boolean)
  if (words.length < 2) return { valid: false, error: 'Informe seu nome e sobrenome.' }
  const fakeNames = ['teste', 'test', 'asdf', 'qwerty', 'fulano', 'ciclano', 'beltrano']
  if (fakeNames.includes(trimmed.toLowerCase())) return { valid: false, error: 'Informe seu nome real.' }
  if (!/^[a-záàâãéèêíîóôõúùûç\s'\-]+$/i.test(trimmed)) return { valid: false, error: 'Nome não pode ter números.' }
  return { valid: true }
}
