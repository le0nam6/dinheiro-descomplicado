// Endinheirados — IG Notícia Plugin
// Cria o card de notícia 1080×1350 no Figma

const GREEN = { r: 0.290, g: 0.871, b: 0.502 }  // #4ADE80
const DARK  = { r: 0.051, g: 0.169, b: 0.078 }  // #0D2B14
const BG    = { r: 0.969, g: 0.973, b: 0.965 }  // #f7f8f6
const WHITE = { r: 1, g: 1, b: 1 }
const GRAY  = { r: 0.267, g: 0.267, b: 0.267 }  // #444
const PHBG  = { r: 0.820, g: 0.973, b: 0.898 }  // #d1fae5

const W = 1080, H = 1350
const PAD_X = 56, PAD_TOP = 36, PAD_BOT = 40
const INNER = W - PAD_X * 2   // 968
const RADIUS = 48

figma.showUI(__html__, { width: 320, height: 520 })

figma.ui.onmessage = async (msg) => {
  if (msg.type === 'create-template') {
    await createTemplate()
  }
  if (msg.type === 'generate') {
    await generatePost(msg.post)
  }
}

// ─── Helpers ───────────────────────────────────────────────────────────────

function rgb(hex) {
  const n = parseInt(hex.replace('#',''), 16)
  return { r: ((n>>16)&255)/255, g: ((n>>8)&255)/255, b: (n&255)/255 }
}

function solid(color) {
  return [{ type: 'SOLID', color }]
}

function setCorner(node, r) {
  node.cornerRadius = r
}

async function loadFonts() {
  await Promise.all([
    figma.loadFontAsync({ family: 'Nunito', style: 'ExtraBold' }),
    figma.loadFontAsync({ family: 'Lexend Deca', style: 'Regular' }),
    figma.loadFontAsync({ family: 'Nunito', style: 'Bold' }),
  ])
}

function makeRect({ name, w, h, color, radius = 0 }) {
  const r = figma.createRectangle()
  r.name = name
  r.resize(w, h)
  r.fills = solid(color)
  if (radius) setCorner(r, radius)
  return r
}

async function makeText({ chars, size, family, style, color, w }) {
  const t = figma.createText()
  await figma.loadFontAsync({ family, style })
  t.characters = chars
  t.fontSize = size
  t.fontName = { family, style }
  t.fills = solid(color)
  t.textAutoResize = 'HEIGHT'
  if (w) t.resize(w, t.height)
  return t
}

async function fetchImageBytes(url) {
  // Pede pra UI fazer o fetch (plugin sandbox não tem fetch direto)
  return new Promise((resolve, reject) => {
    figma.ui.postMessage({ type: 'fetch-image', url })
    const handler = (msg) => {
      if (msg.type === 'image-bytes') {
        figma.ui.off('message', handler)
        resolve(new Uint8Array(msg.bytes))
      }
      if (msg.type === 'image-error') {
        figma.ui.off('message', handler)
        reject(new Error(msg.error))
      }
    }
    figma.ui.on('message', handler)
  })
}

// ─── Cria frame base ────────────────────────────────────────────────────────

async function buildFrame(post) {
  await loadFonts()

  const page = figma.currentPage
  const frame = figma.createFrame()
  frame.name = post ? `IG · ${post.title.slice(0, 40)}` : 'IG Notícia — Template'
  frame.resize(W, H)
  frame.fills = solid(BG)
  frame.clipsContent = true

  // ── Logo placeholder (será substituído pela imagem real) ──
  const logoArea = figma.createFrame()
  logoArea.name = 'Logo'
  logoArea.resize(240, 160)
  logoArea.fills = []
  logoArea.clipsContent = true
  // Texto como placeholder
  const logoText = await makeText({ chars: 'ENDINHEIRADOS', size: 18, family: 'Nunito', style: 'ExtraBold', color: DARK, w: 240 })
  logoText.textAlignHorizontal = 'CENTER'
  logoArea.appendChild(logoText)
  logoText.x = 0; logoText.y = 68
  frame.appendChild(logoArea)
  logoArea.x = (W - 240) / 2
  logoArea.y = PAD_TOP

  // ── Frame da foto ──
  const photoFrame = figma.createFrame()
  photoFrame.name = 'Foto'
  photoFrame.resize(INNER, 590)
  photoFrame.fills = solid(PHBG)
  setCorner(photoFrame, RADIUS)
  photoFrame.clipsContent = true

  if (post?.photoBytes) {
    const imgHash = figma.createImage(post.photoBytes)
    photoFrame.fills = [{ type: 'IMAGE', scaleMode: 'FILL', imageHash: imgHash.hash }]
  }

  // Badge de data
  const badge = figma.createFrame()
  badge.name = 'Data'
  badge.resize(120, 48)
  badge.fills = solid(GREEN)
  badge.cornerRadius = 100
  badge.layoutMode = 'HORIZONTAL'
  badge.primaryAxisAlignItems = 'CENTER'
  badge.counterAxisAlignItems = 'CENTER'
  const dateText = await makeText({
    chars: post?.date || '27/06',
    size: 26, family: 'Lexend Deca', style: 'Regular', color: DARK,
  })
  badge.appendChild(dateText)
  badge.resize(Math.max(120, dateText.width + 48), 48)
  photoFrame.appendChild(badge)
  badge.x = 20; badge.y = 590 - 20 - 48

  frame.appendChild(photoFrame)
  photoFrame.x = PAD_X
  photoFrame.y = PAD_TOP + 160 + 8  // após logo + gap

  // ── Card branco ──
  const card = figma.createFrame()
  card.name = 'Card'
  card.layoutMode = 'VERTICAL'
  card.primaryAxisSizingMode = 'AUTO'
  card.counterAxisSizingMode = 'FIXED'
  card.resize(INNER, 100)
  card.fills = solid(WHITE)
  setCorner(card, RADIUS)
  card.paddingTop = 40; card.paddingBottom = 36
  card.paddingLeft = 52; card.paddingRight = 52
  card.itemSpacing = 18

  // Efeito de sombra
  card.effects = [{
    type: 'DROP_SHADOW',
    color: { r: 0, g: 0, b: 0, a: 0.10 },
    offset: { x: 0, y: 8 },
    radius: 48,
    spread: 0,
    visible: true,
    blendMode: 'NORMAL',
  }]

  const title = await makeText({
    chars: post?.title || 'Título da notícia vai aparecer aqui completo',
    size: 50, family: 'Nunito', style: 'ExtraBold', color: DARK,
    w: INNER - 52 * 2,
  })
  title.name = 'Título'
  title.lineHeight = { value: 110, unit: 'PERCENT' }

  const excerpt = await makeText({
    chars: post?.excerpt || 'Texto de prévia da notícia aparece aqui. Deve ter entre 1 e 3 frases curtas.',
    size: 34, family: 'Lexend Deca', style: 'Regular', color: GRAY,
    w: INNER - 52 * 2,
  })
  excerpt.name = 'Excerpt'
  excerpt.lineHeight = { value: 145, unit: 'PERCENT' }

  card.appendChild(title)
  card.appendChild(excerpt)

  const photoBottom = PAD_TOP + 160 + 8 + 590
  card.x = PAD_X
  card.y = photoBottom + 20
  frame.appendChild(card)

  // Atualiza altura do card para ocupar o espaço restante
  const cardBottom = card.y + card.height
  const footerH = 60
  const remaining = H - cardBottom - 24 - footerH - PAD_BOT

  // ── Rodapé ──
  const footer = figma.createFrame()
  footer.name = 'Rodapé'
  footer.layoutMode = 'HORIZONTAL'
  footer.primaryAxisSizingMode = 'AUTO'
  footer.counterAxisSizingMode = 'AUTO'
  footer.primaryAxisAlignItems = 'CENTER'
  footer.counterAxisAlignItems = 'CENTER'
  footer.fills = []
  footer.itemSpacing = 16

  const circle = figma.createEllipse()
  circle.name = 'Seta'
  circle.resize(52, 52)
  circle.fills = solid(GREEN)

  const arrow = await makeText({ chars: '→', size: 24, family: 'Nunito', style: 'Bold', color: DARK })
  arrow.x = 14; arrow.y = 14

  const circleGroup = figma.createFrame()
  circleGroup.name = 'CircleArrow'
  circleGroup.resize(52, 52)
  circleGroup.fills = solid(GREEN)
  circleGroup.cornerRadius = 100
  circleGroup.clipsContent = true
  const arrowInner = await makeText({ chars: '→', size: 24, family: 'Nunito', style: 'Bold', color: DARK })
  circleGroup.appendChild(arrowInner)
  arrowInner.x = 14; arrowInner.y = 14

  const leia = await makeText({ chars: 'Leia mais em ', size: 28, family: 'Lexend Deca', style: 'Regular', color: { r: 0.4, g: 0.4, b: 0.4 } })
  const site = await makeText({ chars: 'endinheirados.cc', size: 28, family: 'Nunito', style: 'ExtraBold', color: DARK })

  const textRow = figma.createFrame()
  textRow.name = 'FooterText'
  textRow.layoutMode = 'HORIZONTAL'
  textRow.primaryAxisSizingMode = 'AUTO'
  textRow.counterAxisSizingMode = 'AUTO'
  textRow.fills = []
  textRow.itemSpacing = 0
  textRow.primaryAxisAlignItems = 'CENTER'
  textRow.counterAxisAlignItems = 'CENTER'
  textRow.appendChild(leia)
  textRow.appendChild(site)

  footer.appendChild(circleGroup)
  footer.appendChild(textRow)

  footer.x = (W - footer.width) / 2
  footer.y = H - PAD_BOT - footer.height
  frame.appendChild(footer)

  // Centraliza horizontalmente
  footer.x = (W - footer.width) / 2

  // Move frame pro centro da tela
  const viewCenter = figma.viewport.center
  frame.x = viewCenter.x - W / 2
  frame.y = viewCenter.y - H / 2

  page.appendChild(frame)
  figma.currentPage.selection = [frame]
  figma.viewport.scrollAndZoomIntoView([frame])

  return frame
}

// ─── Cria template em branco ─────────────────────────────────────────────

async function createTemplate() {
  try {
    await buildFrame(null)
    figma.ui.postMessage({ type: 'done', text: 'Template criado! Edite as cores e fontes conforme quiser.' })
  } catch (e) {
    figma.ui.postMessage({ type: 'error', text: e.message })
  }
}

// ─── Gera post com dados reais ───────────────────────────────────────────

async function generatePost(post) {
  try {
    // Pede bytes da foto para a UI
    let photoBytes = null
    if (post.photoUrl) {
      try {
        figma.ui.postMessage({ type: 'fetch-image', url: post.photoUrl })
        photoBytes = await new Promise((res, rej) => {
          const t = setTimeout(() => rej(new Error('timeout')), 15000)
          const h = (e) => {
            if (e.pluginMessage?.type === 'image-bytes') { clearTimeout(t); res(new Uint8Array(e.pluginMessage.bytes)) }
            if (e.pluginMessage?.type === 'image-error') { clearTimeout(t); rej(new Error(e.pluginMessage.error)) }
          }
          figma.ui.once('message', h)
        })
      } catch { /* sem foto, usa placeholder */ }
    }

    await buildFrame({ ...post, photoBytes })
    figma.ui.postMessage({ type: 'done', text: `Card gerado: ${post.title.slice(0, 30)}…` })
  } catch (e) {
    figma.ui.postMessage({ type: 'error', text: e.message })
  }
}
