-- イベントへの所属（users と events の多対多 + 役割）と、所属で判定する RLS。仕様は docs/db.md

create type public.event_member_role as enum ('staff', 'visitor');

create table public.event_members (
    user_id uuid not null references public.users (id) on delete cascade,
    event_id uuid not null references public.events (id) on delete cascade,
    role public.event_member_role not null,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    primary key (user_id, event_id)
);

create index event_members_event_id_idx on public.event_members (event_id);

create trigger event_members_set_updated_at
    before update on public.event_members
    for each row execute function public.set_updated_at();

-- 所属の判定。PostgREST に公開しない private スキーマに置き、RPC から呼べないようにする。
-- security definer で event_members の RLS を通さずに引く（event_members のポリシーとの再帰を避ける）
create schema if not exists private;
grant usage on schema private to authenticated;

create function private.is_event_member(target_event_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
    select exists (
        select 1
        from public.event_members as m
        join public.users as u on u.id = m.user_id
        where m.event_id = target_event_id
            and m.user_id = auth.uid()
            and u.deleted_at is null
    );
$$;

create function private.is_event_staff(target_event_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
    select exists (
        select 1
        from public.event_members as m
        join public.users as u on u.id = m.user_id
        where m.event_id = target_event_id
            and m.user_id = auth.uid()
            and m.role = 'staff'
            and u.deleted_at is null
    );
$$;

revoke execute on function private.is_event_member(uuid) from public;
revoke execute on function private.is_event_staff(uuid) from public;
grant execute on function private.is_event_member(uuid) to authenticated;
grant execute on function private.is_event_staff(uuid) to authenticated;

-- RLS: JWT の app_metadata.event_id で判定していたポリシーを、所属の判定に置き換える
drop policy events_select_same_event on public.events;
drop policy articles_select_same_event on public.articles;
drop policy articles_insert_same_event on public.articles;
drop policy articles_update_same_event on public.articles;
drop policy articles_delete_same_event on public.articles;

create policy events_select_member on public.events
    for select to authenticated
    using (private.is_event_member(id));

create policy articles_select_member on public.articles
    for select to authenticated
    using (private.is_event_member(event_id));

create policy articles_insert_staff on public.articles
    for insert to authenticated
    with check (private.is_event_staff(event_id));

create policy articles_update_staff on public.articles
    for update to authenticated
    using (private.is_event_staff(event_id))
    with check (private.is_event_staff(event_id));

-- 記事は論理削除しかしないので、delete のポリシーは置かない（service_role のみ）

-- RLS: 自分の所属だけ読める。書き込みは service_role のみ
alter table public.event_members enable row level security;

create policy event_members_select_own on public.event_members
    for select to authenticated
    using (user_id = (select auth.uid()));
