-- 記事のタイトル・本文を版（article_histories）だけに持たせ、articles は版を番号で指す。仕様は docs/db.md

-- 既存の記事と版は移さずに消す
truncate public.article_histories, public.articles;

-- 版1は create_article で作るので、作成時のトリガーは使わない。保存の関数は作り直す
drop trigger articles_create_first_history on public.articles;
drop function public.create_first_article_history();
drop function public.save_article(uuid, text, jsonb, public.article_status);

-- status を消す前に、status を参照しているポリシーを消す
drop policy articles_select_member_published on public.articles;

alter table public.articles
    drop column title,
    drop column content,
    drop column status;

-- 公開状態は公開中の版があるかどうかで決まるので、生成列にする
alter table public.articles
    add column latest_version integer not null,
    add column status public.article_status not null generated always as (
        case
            when published_version is null then 'draft'::public.article_status
            else 'published'::public.article_status
        end
    ) stored;

-- 記事と版1を同じトランザクションで作るので、確かめるのはコミット時にする
alter table public.articles
    add constraint articles_latest_version_fkey
    foreign key (id, latest_version) references public.article_histories (article_id, version)
    deferrable initially deferred;

-- 公開日時は、初めて公開中の版が入ったときの now() で固定する。渡された値は使わない。
-- 生成列（status）は before トリガーの中ではまだ計算されていないので、published_version で判定する
create or replace function public.set_article_published_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
    if tg_op = 'UPDATE' and old.published_at is not null then
        new.published_at = old.published_at;
    elsif new.published_version is not null then
        new.published_at = now();
    else
        new.published_at = null;
    end if;
    return new;
end;
$$;

-- RLS: staff は下書きも読める。それ以外のメンバーは公開中の版がある記事だけ読める
create policy articles_select_member_published on public.articles
    for select to authenticated
    using (published_version is not null and private.is_event_member(event_id));

-- 記事の作成。記事と版1を1トランザクションで作る。
-- security invoker（既定）なので、articles / article_histories の RLS がそのまま効く
create function public.create_article(
    target_event_id uuid,
    new_title text,
    new_content jsonb
)
returns uuid
language plpgsql
set search_path = ''
as $$
declare
    created_article_id uuid;
begin
    insert into public.articles (event_id, created_by, latest_version)
    values (target_event_id, auth.uid(), 1)
    returning id into created_article_id;

    insert into public.article_histories (article_id, version, created_by, title, content)
    values (created_article_id, 1, auth.uid(), new_title, new_content);

    return created_article_id;
end;
$$;

revoke execute on function public.create_article(uuid, text, jsonb) from public, anon;
grant execute on function public.create_article(uuid, text, jsonb) to authenticated;

-- 記事の保存。版の追加・上書きと、記事が指す版の更新を1トランザクションで行う。
-- security invoker（既定）なので、articles / article_histories の RLS がそのまま効く
create function public.save_article(
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
        and latest.version is distinct from target.published_version then
        -- 同じ人が続けて保存したら、行を節約するため最新の版を上書きする（公開中の版は残す）
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

revoke execute on function public.save_article(uuid, text, jsonb, public.article_status) from public, anon;
grant execute on function public.save_article(uuid, text, jsonb, public.article_status) to authenticated;

-- RLS: 公開中の版は、記事のイベントのメンバーなら読める（staff は今までどおりすべての版を読める）
create policy article_histories_select_member_published on public.article_histories
    for select to authenticated
    using (exists (
        select 1
        from public.articles as a
        where a.id = article_histories.article_id
            and a.published_version = article_histories.version
            and private.is_event_member(a.event_id)
    ));

-- RLS: 公開中の版は上書きできない
drop policy article_histories_update_staff on public.article_histories;

create policy article_histories_update_staff on public.article_histories
    for update to authenticated
    using (exists (
        select 1
        from public.articles as a
        where a.id = article_histories.article_id
            and a.published_version is distinct from article_histories.version
            and private.is_event_staff(a.event_id)
    ))
    with check (
        created_by = (select auth.uid())
        and exists (
            select 1
            from public.articles as a
            where a.id = article_histories.article_id
                and a.published_version is distinct from article_histories.version
                and private.is_event_staff(a.event_id)
        )
    );
