-- Prism AI — Supabase schema. Run this in the Supabase SQL editor.
-- Idempotent-ish: safe to run on a fresh project.

create extension if not exists vector;

-- ---------------------------------------------------------------------------
-- Core tables (as specified)
-- ---------------------------------------------------------------------------
create table if not exists orgs (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  created_at timestamptz default now()
);

create table if not exists profiles (
  id uuid primary key references auth.users,
  org_id uuid references orgs(id),
  email text,
  created_at timestamptz default now()
);

create table if not exists documents (
  id uuid primary key default gen_random_uuid(),
  org_id uuid references orgs(id),
  name text,
  size integer,
  status text default 'indexing',
  error text,
  created_at timestamptz default now()
);

-- For projects created before `error` existed:
alter table documents add column if not exists error text;

create table if not exists chunks (
  id uuid primary key default gen_random_uuid(),
  document_id uuid references documents(id),
  org_id uuid references orgs(id),
  content text,
  location text,
  embedding vector(1024),
  created_at timestamptz default now()
);

create table if not exists conversations (
  id uuid primary key default gen_random_uuid(),
  org_id uuid references orgs(id),
  title text,
  created_at timestamptz default now()
);

create table if not exists messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid references conversations(id),
  role text,
  content text,
  citations jsonb,
  created_at timestamptz default now()
);

-- ---------------------------------------------------------------------------
-- Indexes
-- ---------------------------------------------------------------------------
create index if not exists idx_chunks_org on chunks(org_id);
create index if not exists idx_documents_org on documents(org_id);
create index if not exists idx_conversations_org on conversations(org_id);
create index if not exists idx_messages_conversation on messages(conversation_id);

-- Approximate-nearest-neighbour index for cosine similarity.
-- (Build after you have some rows; lists=100 is fine for a prototype.)
create index if not exists idx_chunks_embedding
  on chunks using ivfflat (embedding vector_cosine_ops) with (lists = 100);

-- ---------------------------------------------------------------------------
-- Similarity search RPC — org-scoped top-k by cosine distance.
-- ---------------------------------------------------------------------------
create or replace function match_chunks(
  query_embedding vector(1024),
  match_org uuid,
  match_count int default 5
)
returns table (
  id uuid,
  document_id uuid,
  content text,
  location text,
  similarity float
)
language sql stable
as $$
  select
    c.id,
    c.document_id,
    c.content,
    c.location,
    1 - (c.embedding <=> query_embedding) as similarity
  from chunks c
  where c.org_id = match_org
  order by c.embedding <=> query_embedding
  limit match_count;
$$;

-- ---------------------------------------------------------------------------
-- Auto-provision an org + profile when a new auth user signs up.
-- The backend also does this lazily, so the trigger is a convenience.
-- ---------------------------------------------------------------------------
create or replace function handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
declare
  new_org uuid;
begin
  insert into orgs (name)
  values (split_part(coalesce(new.email, 'new'), '@', 1) || '''s organization')
  returning id into new_org;

  insert into profiles (id, org_id, email)
  values (new.id, new_org, new.email)
  on conflict (id) do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();

-- ---------------------------------------------------------------------------
-- RLS: enabled, with NO public policies. All app access goes through the
-- backend using the service-role key, which bypasses RLS and enforces org
-- scoping in code. This keeps the tables locked to anon/auth clients.
-- ---------------------------------------------------------------------------
alter table orgs enable row level security;
alter table profiles enable row level security;
alter table documents enable row level security;
alter table chunks enable row level security;
alter table conversations enable row level security;
alter table messages enable row level security;
