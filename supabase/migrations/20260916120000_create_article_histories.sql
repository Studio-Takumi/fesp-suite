-- 記事の編集履歴（版）と、公開中の版・保存の関数。仕様は docs/db.md

create table public.article_histories (
    id uuid primary key default gen_random_uuid(),
    article_id uuid not null references public.articles (id) on delete cascade,
    version integer not null,
    created_by uuid references public.users (id),
    title text not null check (char_length(title) <= 100),
    content jsonb not null,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    -- 記事の最新の版を引く用も兼ねる
    unique (article_id, version)
);

create trigger article_histories_set_updated_at
    before update on public.article_histories
    for each row execute function public.set_updated_at();

-- 既存の記事は、今の中身を版1にする（保存した人は記事の作成者、日時は記事の更新日時）
insert into public.article_histories (article_id, version, created_by, title, content, created_at, updated_at)
select id, 1, created_by, title, content, updated_at, updated_at
from public.articles;

-- 公開中の版。下書きなら NULL
alter table public.articles
    add column published_version integer;

-- 既存の公開中の記事は版1を公開中にする。updated_at が進まないよう、埋める間だけトリガーを止める
alter table public.articles disable trigger articles_set_updated_at;
update public.articles set published_version = 1 where status = 'published';
alter table public.articles enable trigger articles_set_updated_at;

-- 存在しない版を公開中にできない（published_version が NULL なら判定しない）
alter table public.articles
    add constraint articles_published_version_fkey
    foreign key (id, published_version) references public.article_histories (article_id, version);

-- 記事を作ったら版1を作る。記事の作成が articles の RLS を通っているので、版の書き込みは RLS を通さない
create function public.create_first_article_history()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
    insert into public.article_histories (article_id, version, created_by, title, content)
    values (new.id, 1, new.created_by, new.title, new.content);

    if new.status = 'published' then
        update public.articles set published_version = 1 where id = new.id;
    end if;

    return null;
end;
$$;

create trigger articles_create_first_history
    after insert on public.articles
    for each row execute function public.create_first_article_history();

-- 記事の保存。版の追加と記事の更新を1トランザクションで行う。
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
    order by version desc
    limit 1;

    if not found then
        saved_version := 1;
        insert into public.article_histories (article_id, version, created_by, title, content)
        values (target_article_id, saved_version, auth.uid(), new_title, new_content);
    elsif latest.title = new_title and latest.content = new_content then
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

    if new_status is null then
        -- 公開中の記事は一時保存（公開中の中身を変えない）。下書きは記事も今回の中身にする
        if target.status = 'draft' then
            update public.articles
            set title = new_title, content = new_content
            where id = target_article_id;
        end if;
    elsif new_status = 'published' then
        update public.articles
        set title = new_title, content = new_content, status = 'published', published_version = saved_version
        where id = target_article_id;
    else
        update public.articles
        set title = new_title, content = new_content, status = 'draft', published_version = null
        where id = target_article_id;
    end if;

    return true;
end;
$$;

revoke execute on function public.save_article(uuid, text, jsonb, public.article_status) from public, anon;
grant execute on function public.save_article(uuid, text, jsonb, public.article_status) to authenticated;

-- RLS: 版を読み書きできるのは、記事のイベントの staff だけ。書き込みは自分を保存した人にしたときだけ
alter table public.article_histories enable row level security;

create policy article_histories_select_staff on public.article_histories
    for select to authenticated
    using (exists (
        select 1
        from public.articles as a
        where a.id = article_histories.article_id
            and private.is_event_staff(a.event_id)
    ));

create policy article_histories_insert_staff on public.article_histories
    for insert to authenticated
    with check (
        created_by = (select auth.uid())
        and exists (
            select 1
            from public.articles as a
            where a.id = article_histories.article_id
                and private.is_event_staff(a.event_id)
        )
    );

create policy article_histories_update_staff on public.article_histories
    for update to authenticated
    using (exists (
        select 1
        from public.articles as a
        where a.id = article_histories.article_id
            and private.is_event_staff(a.event_id)
    ))
    with check (
        created_by = (select auth.uid())
        and exists (
            select 1
            from public.articles as a
            where a.id = article_histories.article_id
                and private.is_event_staff(a.event_id)
        )
    );

-- 版は消さないので、delete のポリシーは置かない（service_role のみ）
