-- ウェブアプリの下のナビゲーションバーの項目。1行 = 1項目。仕様は docs/db.md
--
-- 項目はウェブアプリのコードに定数で持っていたが、文化祭ごとに出すページが違うので
-- 実行委員が管理者サイトから編集できるようにする（#93）

create table public.bottom_navs (
    id uuid primary key default gen_random_uuid(),
    event_id uuid not null references public.events (id) on delete cascade,
    label text not null,
    -- lucide のアイコン名（`Bell` など）。取りうる値は packages/schema で決める
    icon text not null,
    href text not null,
    sort_order integer not null default 0,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

-- 項目を左から引く用
create index bottom_navs_event_id_sort_order_idx on public.bottom_navs (event_id, sort_order);

create trigger bottom_navs_set_updated_at
    before update on public.bottom_navs
    for each row execute function public.set_updated_at();

-- RLS: 読めるのはそのイベントのメンバー、書けるのはそのイベントの staff
alter table public.bottom_navs enable row level security;

create policy bottom_navs_select_member on public.bottom_navs
    for select to authenticated
    using (private.is_event_member(event_id));

create policy bottom_navs_insert_staff on public.bottom_navs
    for insert to authenticated
    with check (private.is_event_staff(event_id));

-- 更新後の event_id でも判定する（別のイベントへ付け替えられないようにするため）
create policy bottom_navs_update_staff on public.bottom_navs
    for update to authenticated
    using (private.is_event_staff(event_id))
    with check (private.is_event_staff(event_id));

create policy bottom_navs_delete_staff on public.bottom_navs
    for delete to authenticated
    using (private.is_event_staff(event_id));
