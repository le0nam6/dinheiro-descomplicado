-- Habilita pgvector
create extension if not exists vector;

-- Tabela principal do RAG
create table if not exists editorial_knowledge (
  id          uuid primary key default gen_random_uuid(),
  source      text not null,   -- 'the-news-geral' | 'the-news-night' | 'tns-money'
  category    text not null,   -- 'titulo' | 'abertura' | 'zoom-out' | 'estrutura' | 'tom' | 'collab' | 'marcador'
  content     text not null,   -- o exemplo ou padrão em si
  example     text,            -- trecho literal da edição (quando disponível)
  edition_date date,
  metadata    jsonb default '{}',
  embedding   vector(512),     -- voyage-3-lite
  created_at  timestamptz default now()
);

-- Índice para busca semântica
create index if not exists editorial_knowledge_embedding_idx
  on editorial_knowledge
  using ivfflat (embedding vector_cosine_ops)
  with (lists = 100);

-- Índice para filtros por categoria/fonte
create index if not exists editorial_knowledge_category_idx on editorial_knowledge (category);
create index if not exists editorial_knowledge_source_idx on editorial_knowledge (source);
create index if not exists editorial_knowledge_date_idx on editorial_knowledge (edition_date desc);

-- Função de busca semântica
create or replace function search_editorial_knowledge(
  query_embedding vector(512),
  match_count     int default 10,
  filter_category text default null,
  filter_source   text default null,
  min_similarity  float default 0.5
)
returns table (
  id           uuid,
  source       text,
  category     text,
  content      text,
  example      text,
  edition_date date,
  metadata     jsonb,
  similarity   float
)
language sql stable as $$
  select
    id, source, category, content, example, edition_date, metadata,
    1 - (embedding <=> query_embedding) as similarity
  from editorial_knowledge
  where
    (filter_category is null or category = filter_category)
    and (filter_source is null or source = filter_source)
    and (1 - (embedding <=> query_embedding)) >= min_similarity
  order by embedding <=> query_embedding
  limit match_count;
$$;

-- View de estatísticas
create or replace view knowledge_stats as
select
  source,
  category,
  count(*) as total,
  max(edition_date) as last_updated
from editorial_knowledge
group by source, category
order by source, category;
