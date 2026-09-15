-- 記事の作成者（created_by）と、ユーザーの表示名（display_name）。仕様は docs/db.md

-- created_by を NOT NULL で足すため、既存の記事（開発データのみ）を消す
delete from public.articles;

-- ユーザーは論理削除するので、on delete は既定のまま（記事を持つユーザーの行は消せない）
alter table public.articles
    add column created_by uuid not null references public.users (id);

create index articles_created_by_idx on public.articles (created_by);

-- 作成者は変えられない。update で渡されても元の値に戻す
create function public.keep_article_created_by()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
    new.created_by = old.created_by;
    return new;
end;
$$;

create trigger articles_keep_created_by
    before update on public.articles
    for each row execute function public.keep_article_created_by();

-- RLS: 作成は、staff であることに加えて、自分を作成者にしたときだけ
drop policy articles_insert_staff on public.articles;

create policy articles_insert_staff on public.articles
    for insert to authenticated
    with check (private.is_event_staff(event_id) and created_by = (select auth.uid()));

-- 表示名。Google でのログインは full_name（アカウント名）を入れ、メールアドレスでの新規登録は NULL
alter table public.users
    add column display_name text;

create or replace function public.handle_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
    insert into public.users (id, display_name)
    values (new.id, nullif(new.raw_user_meta_data ->> 'full_name', ''));
    return new;
end;
$$;

-- マイグレーション前に作られていたユーザーの表示名
update public.users as u
set display_name = nullif(a.raw_user_meta_data ->> 'full_name', '')
from auth.users as a
where a.id = u.id;

-- 同じイベントに所属しているか。is_event_member と同じく private スキーマの security definer にする
-- （users・event_members の RLS を通さずに引き、users のポリシーとの再帰を避ける）
create function private.shares_event_with(target_user_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
    select exists (
        select 1
        from public.event_members as mine
        join public.event_members as theirs on theirs.event_id = mine.event_id
        join public.users as me on me.id = mine.user_id
        where mine.user_id = auth.uid()
            and theirs.user_id = target_user_id
            and me.deleted_at is null
    );
$$;

revoke execute on function private.shares_event_with(uuid) from public;
grant execute on function private.shares_event_with(uuid) to authenticated;

-- RLS: 同じイベントのメンバーの行を読める（役割・相手の論理削除は問わない）
create policy users_select_same_event on public.users
    for select to authenticated
    using (private.shares_event_with(id));

-- RLS: 読める記事の作成者の行を読める（作成者がイベントを抜けていても、記事に名前を出すため）。
-- 記事の読み取りは articles の RLS がそのまま効く
create policy users_select_article_creator on public.users
    for select to authenticated
    using (exists (select 1 from public.articles as a where a.created_by = users.id));
