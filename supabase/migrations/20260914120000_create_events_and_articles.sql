-- イベント（テナント）と記事本文。仕様は docs/db.md

create table public.events (
    id uuid primary key default gen_random_uuid(),
    slug text not null unique,
    name text not null,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

create table public.articles (
    id uuid primary key default gen_random_uuid(),
    event_id uuid not null references public.events (id) on delete cascade,
    content jsonb not null default '[]'::jsonb,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

create index articles_event_id_updated_at_idx on public.articles (event_id, updated_at desc);

create function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
    new.updated_at = now();
    return new;
end;
$$;

create trigger events_set_updated_at
    before update on public.events
    for each row execute function public.set_updated_at();

create trigger articles_set_updated_at
    before update on public.articles
    for each row execute function public.set_updated_at();

-- RLS: JWT の app_metadata.event_id と一致する行だけ扱える
alter table public.events enable row level security;
alter table public.articles enable row level security;

create policy events_select_same_event on public.events
    for select to authenticated
    using (id = (select (auth.jwt() -> 'app_metadata' ->> 'event_id')::uuid));

create policy articles_select_same_event on public.articles
    for select to authenticated
    using (event_id = (select (auth.jwt() -> 'app_metadata' ->> 'event_id')::uuid));

create policy articles_insert_same_event on public.articles
    for insert to authenticated
    with check (event_id = (select (auth.jwt() -> 'app_metadata' ->> 'event_id')::uuid));

create policy articles_update_same_event on public.articles
    for update to authenticated
    using (event_id = (select (auth.jwt() -> 'app_metadata' ->> 'event_id')::uuid))
    with check (event_id = (select (auth.jwt() -> 'app_metadata' ->> 'event_id')::uuid));

create policy articles_delete_same_event on public.articles
    for delete to authenticated
    using (event_id = (select (auth.jwt() -> 'app_metadata' ->> 'event_id')::uuid));
