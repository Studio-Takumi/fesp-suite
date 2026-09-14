-- ユーザー（auth.users と 1:1）。仕様は docs/db.md

create table public.users (
    id uuid primary key references auth.users (id) on delete cascade,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    deleted_at timestamptz
);

create trigger users_set_updated_at
    before update on public.users
    for each row execute function public.set_updated_at();

-- auth.users に行が入ったら users にも1行作る（メールアドレスでの新規登録・Google での初回ログイン）
create function public.handle_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
    insert into public.users (id) values (new.id);
    return new;
end;
$$;

create trigger on_auth_user_created
    after insert on auth.users
    for each row execute function public.handle_new_auth_user();

-- マイグレーション前に作られていたユーザーの行
insert into public.users (id)
select id from auth.users
on conflict (id) do nothing;

-- RLS: 自分の行だけ読める。書き込みはトリガーと service_role のみ
alter table public.users enable row level security;

create policy users_select_own on public.users
    for select to authenticated
    using (id = (select auth.uid()));
