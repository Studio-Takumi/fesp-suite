-- 記事のパス（slug）。slug を持つ記事は、ウェブアプリの `/<slug>` で開ける。仕様は docs/db.md

alter table public.articles add column slug text;

-- slug の形式と予約語は packages/schema の articleSlugSchema と揃える
alter table public.articles
    add constraint articles_slug_format_check check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$' and length(slug) <= 32),
    add constraint articles_slug_reserved_check check (slug not in ('login', 'signup', 'settings', 'articles'));

-- slug はイベント内で一意。slug を持たない記事（`/articles/:id` でだけ開く記事）はいくつあってもよい
create unique index articles_event_id_slug_key on public.articles (event_id, slug);

-- 動作確認用の仮ページ。イベントごとに、固定ページの記事（版1・公開）を slug つきで作る。
-- 本文は独自コンポーネントを並べただけのもので、中身は種類ごとのIssue（#56〜#63）で作り直す
do $$
declare
    target_event record;
    author_id uuid;
    page_row record;
    new_article_id uuid;
begin
    for target_event in select id from public.events loop
        -- slug を持つ記事がすでにあるイベントは飛ばす
        if exists (select 1 from public.articles where event_id = target_event.id and slug is not null) then
            continue;
        end if;

        -- 記事の作成者は、そのイベントの staff から1人。staff がいなければ作らない
        -- （select into は行が無いと変数を変えないので、イベントごとに空にしてから引く）
        author_id := null;
        select user_id into author_id
            from public.event_members
            where event_id = target_event.id and role = 'staff'
            order by created_at
            limit 1;
        if author_id is null then
            continue;
        end if;

        for page_row in
            select *
            from (values
                ('home', 'ホーム', '[{"id": "home-hero", "type": "mainHero", "props": {"slides": "https://images.unsplash.com/photo-1678964335849-30d96ce65870?w=1080&q=80|第42回 あおば祭|あおば祭へ、ようこそ\nhttps://images.unsplash.com/photo-1619634579871-5aacd9a0087a?w=1080&q=80|9月19日（土）・20日（日）|2日間、全力で楽しもう\nhttps://images.unsplash.com/photo-1656281144468-a8643338ba35?w=1080&q=80|今年のテーマ|つながる、ひろがる"}, "children": []}, {"id": "home-weather", "type": "weatherBar", "props": {}, "children": []}, {"id": "home-news", "type": "newsList", "props": {"showTagTabs": false, "tags": "", "limit": 3, "showViewAll": true}, "children": []}, {"id": "home-contents", "type": "contentList", "props": {"links": "スケジュール|calendar-days|/schedule\nマップ|map|/map\n模擬店|store|/shop\n出演者|music|/artist\n天気|cloud-sun|/weather\nブログ|newspaper|/blog"}, "children": []}]'::jsonb),
                ('news', 'お知らせ', '[{"id": "news-header", "type": "pageHeader", "props": {"label": "NEWS", "title": "お知らせ"}, "children": []}, {"id": "news-list", "type": "newsList", "props": {"showTagTabs": true, "tags": "", "showViewAll": false}, "children": []}]'::jsonb),
                ('blog', 'ブログ', '[{"id": "blog-header", "type": "pageHeader", "props": {"label": "BLOG", "title": "ブログ"}, "children": []}, {"id": "blog-list", "type": "blogList", "props": {"showTagTabs": true, "tags": ""}, "children": []}]'::jsonb),
                ('schedule', 'スケジュール', '[{"id": "schedule-header", "type": "pageHeader", "props": {"label": "SCHEDULE", "title": "スケジュール"}, "children": []}, {"id": "schedule-table", "type": "scheduleTable", "props": {"showDateTabs": true}, "children": []}]'::jsonb),
                ('map', 'マップ', '[{"id": "map-header", "type": "pageHeader", "props": {"label": "MAP", "title": "マップ"}, "children": []}, {"id": "map-map", "type": "map", "props": {}, "children": []}]'::jsonb),
                ('weather', '天気', '[{"id": "weather-header", "type": "pageHeader", "props": {"label": "WEATHER", "title": "天気"}, "children": []}, {"id": "weather-today", "type": "todayWeather", "props": {}, "children": []}, {"id": "weather-weekly", "type": "weeklyForecast", "props": {}, "children": []}, {"id": "weather-alert", "type": "weatherAlert", "props": {}, "children": []}, {"id": "weather-wbgt", "type": "wbgt", "props": {}, "children": []}, {"id": "weather-overview", "type": "weatherOverview", "props": {}, "children": []}, {"id": "weather-credit", "type": "weatherCredit", "props": {}, "children": []}]'::jsonb),
                ('shop', '模擬店', '[{"id": "shop-header", "type": "pageHeader", "props": {"label": "SHOP", "title": "模擬店"}, "children": []}, {"id": "shop-list", "type": "shopList", "props": {"showDateTabs": true, "showSearch": true, "showSort": true, "showTagTabs": true, "tags": "", "showProducts": true}, "children": []}]'::jsonb),
                ('artist', '出演者', '[{"id": "artist-header", "type": "pageHeader", "props": {"label": "ARTIST", "title": "出演者"}, "children": []}, {"id": "artist-list", "type": "artistList", "props": {"showDateTabs": true, "showSearch": true, "showSort": true, "showTagTabs": true, "tags": ""}, "children": []}]'::jsonb)
            ) as t (slug, title, content)
        loop
            insert into public.articles (event_id, created_by, latest_version, slug)
                values (target_event.id, author_id, 1, page_row.slug)
                returning id into new_article_id;

            insert into public.article_histories (article_id, version, created_by, title, content)
                values (new_article_id, 1, author_id, page_row.title, page_row.content);

            -- 版1を公開中の版にする（published_at はトリガーで入る）
            update public.articles set published_version = 1 where id = new_article_id;
        end loop;
    end loop;
end $$;
