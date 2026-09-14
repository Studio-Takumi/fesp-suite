-- 記事のタイトル。仕様は docs/db.md

alter table public.articles
    add column title text not null default '' check (char_length(title) <= 100);
