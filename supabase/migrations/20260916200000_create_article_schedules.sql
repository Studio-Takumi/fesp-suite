-- 記事の予約投稿（article_schedules）と、時間が来た予約を公開する仕組み。仕様は docs/db.md

create table public.article_schedules (
    article_id uuid primary key references public.articles (id) on delete cascade,
    version integer not null,
    publish_at timestamptz not null,
    created_by uuid references public.users (id),
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    -- 存在しない版を予約できない
    foreign key (article_id, version) references public.article_histories (article_id, version)
);

-- 時間が来た予約を引く用
create index article_schedules_publish_at_idx on public.article_schedules (publish_at);

create trigger article_schedules_set_updated_at
    before update on public.article_schedules
    for each row execute function public.set_updated_at();

-- RLS: 予約を読み書きできるのは、記事のイベントの staff だけ。作る・上書きするのは自分を予約した人にしたときだけ
alter table public.article_schedules enable row level security;

create policy article_schedules_select_staff on public.article_schedules
    for select to authenticated
    using (exists (
        select 1
        from public.articles as a
        where a.id = article_schedules.article_id
            and private.is_event_staff(a.event_id)
    ));

create policy article_schedules_insert_staff on public.article_schedules
    for insert to authenticated
    with check (
        created_by = (select auth.uid())
        and exists (
            select 1
            from public.articles as a
            where a.id = article_schedules.article_id
                and private.is_event_staff(a.event_id)
        )
    );

create policy article_schedules_update_staff on public.article_schedules
    for update to authenticated
    using (exists (
        select 1
        from public.articles as a
        where a.id = article_schedules.article_id
            and private.is_event_staff(a.event_id)
    ))
    with check (
        created_by = (select auth.uid())
        and exists (
            select 1
            from public.articles as a
            where a.id = article_schedules.article_id
                and private.is_event_staff(a.event_id)
        )
    );

create policy article_schedules_delete_staff on public.article_schedules
    for delete to authenticated
    using (exists (
        select 1
        from public.articles as a
        where a.id = article_schedules.article_id
            and private.is_event_staff(a.event_id)
    ));

-- RLS: 公開中の版に加えて、予約中の版も上書きできない
drop policy article_histories_update_staff on public.article_histories;

create policy article_histories_update_staff on public.article_histories
    for update to authenticated
    using (
        exists (
            select 1
            from public.articles as a
            where a.id = article_histories.article_id
                and a.published_version is distinct from article_histories.version
                and private.is_event_staff(a.event_id)
        )
        and not exists (
            select 1
            from public.article_schedules as s
            where s.article_id = article_histories.article_id
                and s.version = article_histories.version
        )
    )
    with check (
        created_by = (select auth.uid())
        and exists (
            select 1
            from public.articles as a
            where a.id = article_histories.article_id
                and a.published_version is distinct from article_histories.version
                and private.is_event_staff(a.event_id)
        )
        and not exists (
            select 1
            from public.article_schedules as s
            where s.article_id = article_histories.article_id
                and s.version = article_histories.version
        )
    );

-- 記事の保存。予約中の版も上書きしないようにする（ほかは変えない）。
-- 版の RLS で予約中の版は上書きできないので、ここで外さないと上書きが0件になり、保存した中身が残らない
create or replace function public.save_article(
    target_article_id uuid,
    new_title text,
    new_content jsonb,
    new_status public.article_status default null
)
returns boolean
language plpgsql
set search_path = ''
as $$
declare
    target public.articles;
    latest public.article_histories;
    saved_version integer;
begin
    -- for update は articles の update のポリシーも通すので、staff でなければ行が返らない。
    -- 行をロックするので、同時に保存しても版の番号はずれない
    select * into target
    from public.articles
    where id = target_article_id
    for update;

    if not found then
        return false;
    end if;

    select * into latest
    from public.article_histories
    where article_id = target_article_id
        and version = target.latest_version;

    if latest.title = new_title and latest.content = new_content then
        -- 中身が変わっていなければ版を作らない
        saved_version := latest.version;
    elsif latest.created_by = auth.uid()
        and latest.created_at > now() - interval '30 minutes'
        and latest.version is distinct from target.published_version
        and not exists (
            select 1
            from public.article_schedules as s
            where s.article_id = target_article_id
                and s.version = latest.version
        ) then
        -- 同じ人が続けて保存したら、行を節約するため最新の版を上書きする（公開中・予約中の版は残す）
        saved_version := latest.version;
        update public.article_histories
        set title = new_title, content = new_content
        where id = latest.id;
    else
        saved_version := latest.version + 1;
        insert into public.article_histories (article_id, version, created_by, title, content)
        values (target_article_id, saved_version, auth.uid(), new_title, new_content);
    end if;

    -- 中身が変わっていなくても行を更新するので、updated_at は保存のたびに進む
    update public.articles
    set latest_version = saved_version,
        published_version = case
            when new_status is null then target.published_version
            when new_status = 'published' then saved_version
        end
    where id = target_article_id;

    return true;
end;
$$;

-- 公開日時は、初めて公開中の版が入ったときに決める。その版の予約があって日時を過ぎていれば、予約の日時にする。
-- 以降は変わらない。渡された値は使わない
create or replace function public.set_article_published_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
    if tg_op = 'UPDATE' and old.published_at is not null then
        new.published_at = old.published_at;
    elsif new.published_version is not null then
        new.published_at = coalesce(
            (
                select s.publish_at
                from public.article_schedules as s
                where s.article_id = new.id
                    and s.version = new.published_version
                    and s.publish_at <= now()
            ),
            now()
        );
    else
        new.published_at = null;
    end if;
    return new;
end;
$$;

-- 公開中の版が変わったら（公開する・公開に反映して版が変わる・下書きに戻す・予約で公開した）、予約を消す。
-- 値が変わらない更新（一時保存など）では消さない
create function public.delete_article_schedule_on_publish()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
    delete from public.article_schedules
    where article_id = new.id;
    return null;
end;
$$;

create trigger articles_delete_schedule_on_publish
    after update of published_version on public.articles
    for each row
    when (old.published_version is distinct from new.published_version)
    execute function public.delete_article_schedule_on_publish();

-- 予約する。確かめた版が保存で上書きされないよう、記事の行をロックしてから予約を作る・上書きする。
-- security invoker（既定）なので、articles / article_histories / article_schedules の RLS がそのまま効く
create function public.schedule_article(
    target_article_id uuid,
    target_version integer,
    version_updated_at timestamptz,
    new_publish_at timestamptz
)
returns boolean
language plpgsql
set search_path = ''
as $$
declare
    target_history public.article_histories;
begin
    -- for update は articles の update のポリシーも通すので、staff でなければ行が返らない
    perform 1
    from public.articles
    where id = target_article_id
    for update;

    if not found then
        return false;
    end if;

    select * into target_history
    from public.article_histories
    where article_id = target_article_id
        and version = target_version;

    -- PT409 は PostgREST で 409 になる。上書きで中身が変わった版は予約しない
    if not found or target_history.updated_at <> version_updated_at then
        raise exception '予約しようとした版が見つからないか、更新されています'
            using errcode = 'PT409';
    end if;

    insert into public.article_schedules (article_id, version, publish_at, created_by)
    values (target_article_id, target_version, new_publish_at, auth.uid())
    on conflict (article_id) do update
    set version = excluded.version,
        publish_at = excluded.publish_at,
        created_by = excluded.created_by;

    return true;
end;
$$;

revoke execute on function public.schedule_article(uuid, integer, timestamptz, timestamptz) from public, anon;
grant execute on function public.schedule_article(uuid, integer, timestamptz, timestamptz) to authenticated;

-- 予約を取り消す。予約が無くても true を返す
create function public.cancel_article_schedule(target_article_id uuid)
returns boolean
language plpgsql
set search_path = ''
as $$
begin
    -- for update は articles の update のポリシーも通すので、staff でなければ行が返らない
    perform 1
    from public.articles
    where id = target_article_id
    for update;

    if not found then
        return false;
    end if;

    delete from public.article_schedules
    where article_id = target_article_id;

    return true;
end;
$$;

revoke execute on function public.cancel_article_schedule(uuid) from public, anon;
grant execute on function public.cancel_article_schedule(uuid) to authenticated;

-- 時間が来た予約を公開する。pg_cron から動かすので security definer で RLS を通さない。ユーザーからは呼べない
create function public.publish_scheduled_articles()
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
    -- 公開日時（初めての公開なら予約の日時）は articles のトリガーで決まる。予約もトリガーで消える
    update public.articles as a
    set published_version = s.version
    from public.article_schedules as s
    where s.article_id = a.id
        and s.publish_at <= now();

    -- 予約の版がすでに公開中の版だった（published_version が変わらずトリガーが動かない）予約も消す
    delete from public.article_schedules
    where publish_at <= now();
end;
$$;

revoke execute on function public.publish_scheduled_articles() from public, anon, authenticated;
grant execute on function public.publish_scheduled_articles() to service_role;

-- 1分ごとに時間が来た予約を公開する
create extension if not exists pg_cron with schema pg_catalog;

select cron.schedule('publish-scheduled-articles', '* * * * *', 'select public.publish_scheduled_articles()');
