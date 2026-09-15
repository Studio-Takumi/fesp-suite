-- 記事の公開状態（下書き / 公開）と、初めて公開した日時。仕様は docs/db.md

create type public.article_status as enum ('draft', 'published');

-- 既存の記事はいままで全員に見えていたので、見え方を変えないよう公開済みにする。
-- 列の追加時の既定値で埋め、そのあと既定値を下書きに変える
alter table public.articles
    add column status public.article_status not null default 'published',
    add column published_at timestamptz;

-- 既存の記事の公開日時は作成日時にする。updated_at が進まないよう、埋める間だけトリガーを止める
alter table public.articles disable trigger articles_set_updated_at;
update public.articles set published_at = created_at;
alter table public.articles enable trigger articles_set_updated_at;

alter table public.articles
    alter column status set default 'draft';

-- 公開日時は、初めて published になったときの now() で固定する。渡された値は使わない
create function public.set_article_published_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
    if tg_op = 'UPDATE' and old.published_at is not null then
        new.published_at = old.published_at;
    elsif new.status = 'published' then
        new.published_at = now();
    else
        new.published_at = null;
    end if;
    return new;
end;
$$;

create trigger articles_set_published_at
    before insert or update on public.articles
    for each row execute function public.set_article_published_at();

-- RLS: staff は下書きも読める。それ以外のメンバーは公開済みの記事だけ読める
drop policy articles_select_member on public.articles;

create policy articles_select_staff on public.articles
    for select to authenticated
    using (private.is_event_staff(event_id));

create policy articles_select_member_published on public.articles
    for select to authenticated
    using (status = 'published' and private.is_event_member(event_id));
