# Dinheiro Descomplicado — Guia de Setup

## 1. Criar projeto no Sanity (5 min)
1. Acesse https://sanity.io e crie uma conta gratuita
2. Clique em "New project" → nome: `dinheiro-descomplicado`
3. Copie o **Project ID** que aparece no dashboard
4. Vá em API → Tokens → Add API token (Editor) → copie o token

## 2. Preencher o .env.local
```
NEXT_PUBLIC_SANITY_PROJECT_ID=cole_aqui_o_project_id
NEXT_PUBLIC_SANITY_DATASET=production
SANITY_API_TOKEN=cole_aqui_o_token
NEXT_PUBLIC_ADSENSE_ID=ca-pub-SEU_ID (depois do AdSense aprovar)
UNSPLASH_ACCESS_KEY=cole_aqui (pegar em unsplash.com/developers)
ANTHROPIC_API_KEY=sua_chave_anthropic
```

## 3. Criar conta Unsplash Developers (2 min)
1. https://unsplash.com/developers → New Application
2. Copie o Access Key

## 4. Subir no Vercel (3 min)
1. `git init && git add . && git commit -m "initial commit"`
2. Criar repositório no GitHub (dinheiro-descomplicado)
3. `git remote add origin https://github.com/SEU_USER/dinheiro-descomplicado`
4. `git push -u origin main`
5. Acessar vercel.com → Import → selecionar repo
6. Adicionar todas as variáveis de ambiente no Vercel

## 5. Deploy do Sanity schema
```bash
npx sanity deploy
```
→ Acesse /studio no seu domínio para gerenciar posts

## 6. Testar o pipeline de automação
```bash
node scripts/publish-post.mjs tofu
```
→ Deve criar um post no Sanity e ele aparece no blog automaticamente

## 7. Configurar Google AdSense
1. Cadastre o domínio em https://adsense.google.com
2. Aguarde aprovação (normalmente 1-3 semanas, precisa ter conteúdo)
3. Substitua `ca-pub-SEU_ID_AQUI` no .env.local pelo seu Publisher ID
4. Substitua os slot IDs (1234567890 etc.) pelos slots reais criados no AdSense

## 8. Configurar routine automática no Claude
Use o Claude Code com o comando:
```
/schedule - criar rotina 2x/dia para rodar o pipeline
```

## Estrutura de arquivos
```
src/
  app/
    page.tsx          → Homepage com grid de posts
    blog/[slug]/      → Página individual do post
    studio/[[...tool]]/ → Sanity Studio embutido
  components/
    PostCard.tsx      → Card de post na listagem
    AdUnit.tsx        → Componente Google AdSense
  lib/
    sanity.ts         → Queries GROQ para buscar posts
  sanity/schemas/
    post.ts           → Schema do documento post
scripts/
  publish-post.mjs    → Pipeline completo de automação
```
