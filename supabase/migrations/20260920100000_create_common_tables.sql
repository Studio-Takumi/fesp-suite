-- 開催日・場所・タグと、記事とタグの結び付き。お知らせ・模擬店・出演者・スケジュールが揃って参照する
-- 共通の土台。仕様は docs/db.md
--
-- 逆向きの参照は持たせない（場所から模擬店を引くときは、place_id がその場所を指す行を探す）。
-- 委員会（committees）はここでは作らない（#41）

-- 開催日。Day1 / Day2 の正本。模擬店・出演者・スケジュールの日付はこのテーブルを参照する
create table public.event_days (
    id uuid primary key default gen_random_uuid(),
    event_id uuid not null references public.events (id) on delete cascade,
    day integer not null,
    date date not null,
    name text,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    constraint event_days_day_positive check (day >= 1),
    -- 何日目・日付はイベント内で重複させない（同じ日付の開催日を2つ作れない）
    unique (event_id, day),
    unique (event_id, date)
);

-- 開催日を順に引く用
create index event_days_event_id_day_idx on public.event_days (event_id, day);

create trigger event_days_set_updated_at
    before update on public.event_days
    for each row execute function public.set_updated_at();

-- 場所。会場・教室の正本。スケジュール表の列（schedule_columns）はこれを参照せず、名前を自由に決める
create table public.places (
    id uuid primary key default gen_random_uuid(),
    event_id uuid not null references public.events (id) on delete cascade,
    name text not null,
    building text,
    floor text,
    sort_order integer not null default 0,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

-- 一覧・選択肢に出す用
create index places_event_id_sort_order_idx on public.places (event_id, sort_order);

create trigger places_set_updated_at
    before update on public.places
    for each row execute function public.set_updated_at();

-- タグ。お知らせ・ブログ・模擬店・出演者で共通に使い、種類ごとには分けない
create table public.tags (
    id uuid primary key default gen_random_uuid(),
    event_id uuid not null references public.events (id) on delete cascade,
    name text not null,
    sort_order integer not null default 0,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    unique (event_id, name)
);

-- タブ・選択肢に出す用
create index tags_event_id_sort_order_idx on public.tags (event_id, sort_order);

create trigger tags_set_updated_at
    before update on public.tags
    for each row execute function public.set_updated_at();

-- 記事とタグの結び付き。サマリー（posts / shops / artists）は記事と同じ id を持つので、
-- タグはどの種類でもこの1テーブルで足りる
create table public.article_tags (
    article_id uuid not null references public.articles (id) on delete cascade,
    tag_id uuid not null references public.tags (id) on delete cascade,
    created_at timestamptz not null default now(),
    primary key (article_id, tag_id)
);

-- タグで記事を絞り込む用（主キーの先頭は article_id なので、逆向きの索引を別に持つ）
create index article_tags_tag_id_idx on public.article_tags (tag_id);

-- RLS: 読めるのはそのイベントのメンバー、書けるのはそのイベントの staff
alter table public.event_days enable row level security;

create policy event_days_select_member on public.event_days
    for select to authenticated
    using (private.is_event_member(event_id));

create policy event_days_insert_staff on public.event_days
    for insert to authenticated
    with check (private.is_event_staff(event_id));

-- 更新後の event_id でも判定する（別のイベントへ付け替えられないようにするため）
create policy event_days_update_staff on public.event_days
    for update to authenticated
    using (private.is_event_staff(event_id))
    with check (private.is_event_staff(event_id));

create policy event_days_delete_staff on public.event_days
    for delete to authenticated
    using (private.is_event_staff(event_id));

alter table public.places enable row level security;

create policy places_select_member on public.places
    for select to authenticated
    using (private.is_event_member(event_id));

create policy places_insert_staff on public.places
    for insert to authenticated
    with check (private.is_event_staff(event_id));

create policy places_update_staff on public.places
    for update to authenticated
    using (private.is_event_staff(event_id))
    with check (private.is_event_staff(event_id));

create policy places_delete_staff on public.places
    for delete to authenticated
    using (private.is_event_staff(event_id));

alter table public.tags enable row level security;

create policy tags_select_member on public.tags
    for select to authenticated
    using (private.is_event_member(event_id));

create policy tags_insert_staff on public.tags
    for insert to authenticated
    with check (private.is_event_staff(event_id));

create policy tags_update_staff on public.tags
    for update to authenticated
    using (private.is_event_staff(event_id))
    with check (private.is_event_staff(event_id));

create policy tags_delete_staff on public.tags
    for delete to authenticated
    using (private.is_event_staff(event_id));

-- 記事とタグの結び付きは、記事が読めれば読める（articles の RLS に従う）。
-- 書けるのは記事のイベントの staff。タグも同じイベントのものに限る
alter table public.article_tags enable row level security;

create policy article_tags_select_readable_article on public.article_tags
    for select to authenticated
    using (exists (
        select 1
        from public.articles as a
        where a.id = article_tags.article_id
    ));

create policy article_tags_insert_staff on public.article_tags
    for insert to authenticated
    with check (exists (
        select 1
        from public.articles as a
        join public.tags as t on t.id = article_tags.tag_id
        where a.id = article_tags.article_id
            and t.event_id = a.event_id
            and private.is_event_staff(a.event_id)
    ));

create policy article_tags_update_staff on public.article_tags
    for update to authenticated
    using (exists (
        select 1
        from public.articles as a
        where a.id = article_tags.article_id
            and private.is_event_staff(a.event_id)
    ))
    with check (exists (
        select 1
        from public.articles as a
        join public.tags as t on t.id = article_tags.tag_id
        where a.id = article_tags.article_id
            and t.event_id = a.event_id
            and private.is_event_staff(a.event_id)
    ));

create policy article_tags_delete_staff on public.article_tags
    for delete to authenticated
    using (exists (
        select 1
        from public.articles as a
        where a.id = article_tags.article_id
            and private.is_event_staff(a.event_id)
    ));
