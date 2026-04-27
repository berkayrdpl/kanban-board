-- ============================================================
-- Kanban Board – initial schema
-- ============================================================
-- Tables:
--   profiles  – mirrors auth.users, holds display info
--   boards    – top-level container
--   columns   – ordered list inside a board
--   cards     – ordered list inside a column
--
-- Ordering strategy (CRITICAL):
--   Both `columns` and `cards` carry a `position` of type DOUBLE PRECISION.
--   When we need to insert / move an item between two siblings A and B,
--   the new position is (A.position + B.position) / 2.
--   When inserting at the start  → new = first.position - 1024
--   When inserting at the end    → new = last.position  + 1024
--   This avoids re-numbering siblings on every move (only one row UPDATE).
--   Drift is unlikely with float8 precision; a periodic REBALANCE
--   procedure (commented at the bottom) can be run if needed.
--
-- Security: RLS is enabled everywhere. Users can only access their own
-- boards (and the columns/cards underneath them).
-- ============================================================

-- ---------- extensions ----------
create extension if not exists "pgcrypto";   -- gen_random_uuid()

-- ---------- profiles ----------
create table if not exists public.profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  email       text,
  display_name text,
  created_at  timestamptz not null default now()
);

alter table public.profiles enable row level security;

drop policy if exists "profiles: read own" on public.profiles;
create policy "profiles: read own"
  on public.profiles for select
  using (auth.uid() = id);

drop policy if exists "profiles: update own" on public.profiles;
create policy "profiles: update own"
  on public.profiles for update
  using (auth.uid() = id);

-- Auto-insert a profile row on signup
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, display_name)
  values (new.id, new.email, split_part(new.email, '@', 1))
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------- boards ----------
create table if not exists public.boards (
  id          uuid primary key default gen_random_uuid(),
  owner_id    uuid not null references auth.users(id) on delete cascade,
  title       text not null check (char_length(title) between 1 and 120),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index if not exists boards_owner_idx on public.boards(owner_id);

alter table public.boards enable row level security;

drop policy if exists "boards: owner all" on public.boards;
create policy "boards: owner all"
  on public.boards for all
  using (auth.uid() = owner_id)
  with check (auth.uid() = owner_id);

-- ---------- columns ----------
create table if not exists public.columns (
  id          uuid primary key default gen_random_uuid(),
  board_id    uuid not null references public.boards(id) on delete cascade,
  title       text not null check (char_length(title) between 1 and 80),
  position    double precision not null,
  created_at  timestamptz not null default now()
);

create index if not exists columns_board_idx on public.columns(board_id, position);

alter table public.columns enable row level security;

-- Owner of the parent board has full access
drop policy if exists "columns: via board owner" on public.columns;
create policy "columns: via board owner"
  on public.columns for all
  using (
    exists (
      select 1 from public.boards b
      where b.id = columns.board_id and b.owner_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.boards b
      where b.id = columns.board_id and b.owner_id = auth.uid()
    )
  );

-- ---------- cards ----------
create table if not exists public.cards (
  id           uuid primary key default gen_random_uuid(),
  column_id    uuid not null references public.columns(id) on delete cascade,
  title        text not null check (char_length(title) between 1 and 200),
  description  text,
  position     double precision not null,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create index if not exists cards_column_idx on public.cards(column_id, position);

alter table public.cards enable row level security;

drop policy if exists "cards: via board owner" on public.cards;
create policy "cards: via board owner"
  on public.cards for all
  using (
    exists (
      select 1 from public.columns c
      join public.boards b on b.id = c.board_id
      where c.id = cards.column_id and b.owner_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.columns c
      join public.boards b on b.id = c.board_id
      where c.id = cards.column_id and b.owner_id = auth.uid()
    )
  );

-- ---------- updated_at trigger ----------
create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists boards_touch on public.boards;
create trigger boards_touch
  before update on public.boards
  for each row execute function public.touch_updated_at();

drop trigger if exists cards_touch on public.cards;
create trigger cards_touch
  before update on public.cards
  for each row execute function public.touch_updated_at();

-- ---------- (optional) rebalance helper ----------
-- If float positions ever drift too close to each other, this rewrites
-- positions to clean increments (1024, 2048, ...). Not used in normal flow.
create or replace function public.rebalance_cards(p_column_id uuid)
returns void language plpgsql security definer as $$
declare
  rec record;
  i   integer := 1;
begin
  for rec in
    select id from public.cards
    where column_id = p_column_id
    order by position asc
  loop
    update public.cards set position = i * 1024 where id = rec.id;
    i := i + 1;
  end loop;
end;
$$;

create or replace function public.rebalance_columns(p_board_id uuid)
returns void language plpgsql security definer as $$
declare
  rec record;
  i   integer := 1;
begin
  for rec in
    select id from public.columns
    where board_id = p_board_id
    order by position asc
  loop
    update public.columns set position = i * 1024 where id = rec.id;
    i := i + 1;
  end loop;
end;
$$;
