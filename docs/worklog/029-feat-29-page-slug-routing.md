---
title: 記事のパス（slug）でウェブアプリのページを開けるようにする
issue: 29
branch: 'feat/#29-page-slug-routing'
date: 2026-09-19
---

# 029 feat: #29 記事のパス（slug）でウェブアプリのページを開けるようにする

## やったこと

`articles` に `slug` を足し、`/news` や `/schedule` のようなパスで記事を開けるようにした。
ホーム（`/`）も slug が `home` の記事を出す形に置き換え、`/news/:postId` などの個別ページは
仮ページとして先にパスだけ通してある。`/articles/:articleId` はそのまま残した。

## 変更したファイル

| ファイル                                                      | 変更内容                                                                                                                      |
| ------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| `supabase/migrations/20260919120000_add_slug_to_articles.sql` | 追加。`articles.slug` と制約・一意インデックス。動作確認用の固定ページ8件も入れる                                             |
| `packages/schema/src/article.ts`                              | `articleSlugSchema` / `reservedArticleSlugs` / `homeArticleSlug` / `articleSlugParamSchema` を追加。記事オブジェクトに `slug` |
| `packages/types/src/database.generated.ts`                    | 再生成                                                                                                                        |
| `apps/api/src/routes/articles.ts`                             | `GET /api/articles/slug/:slug` を追加。記事の列に `slug` を足した                                                             |
| `apps/web/src/router.tsx`                                     | `/$articleSlug` と個別ページ4本を追加                                                                                         |
| `apps/web/src/pages/HomePage.tsx`                             | 配線確認ページをやめ、slug が `home` の記事を出す形にした                                                                     |
| `apps/web/src/pages/SlugPage.tsx`                             | 追加。`/:articleSlug` の記事を出す                                                                                            |
| `apps/web/src/pages/NewsPostPage.tsx` ほか3件                 | 追加。個別ページの仮ページ（ブログ・模擬店・出演者）                                                                          |
| `apps/web/src/components/article/ArticleBody.tsx`             | 追加。本文を同じ間隔で描画する共通部品                                                                                        |
| `apps/web/src/lib/mock/preview-articles.ts`                   | 追加。個別ページの仮の本文                                                                                                    |
| `apps/web/src/lib/queries.ts`                                 | `articleBySlugQuery` を追加                                                                                                   |
| `docs/db.md` / `docs/api.md` / `docs/app.md`                  | `slug` の列・エンドポイント・ページの仕様を追記                                                                               |

## 実装メモ

- **slug は `articles` に持たせた。** 最初は `pages` テーブル（slug・表示名・記事への参照）を作る形で実装したが、
  発注者の判断で「その役割は `articles` が持つ。あとで `news` / `blogs` を作るので二重管理にしない」となり、
  開発用プロジェクトに当てた `pages` を `migration repair` で取り消してから入れ直した
- **slug は `null` を許す。** slug を持つ記事は `/<slug>` で開け、持たない記事は `/articles/:id` でだけ開く。
  一意インデックスは `(event_id, slug)` なので、slug を持たない記事はいくつあってもよい
- **slug の形式と予約語は DB と zod の両方に置いた**（`^[a-z0-9]+(-[a-z0-9]+)*$`・32文字まで・
  `login` / `signup` / `settings` / `articles` は不可）。ウェブアプリの静的なパスがルーティングで先に選ばれるので、
  同じ slug を作れてしまうと開けないページができる
- **ウェブアプリのルートは `/$articleSlug` の1本にまとめた。** ページを増やすのは記事に slug を付けるだけで済む。
  個別ページ（`/news/:postId` など）はセグメントが2つなので、この1本とは当たらない
- **ナビの表示名・並び順の列は入れていない。** 表示名は記事のタイトルで足りる。ナビ（#91）で要るとなったら足す
- **テンプレート名の列も入れていない。** テンプレートの中身が #63・#64 で決まってから足す
- **仮ページの中身はマイグレーションで直接 insert した**（関数にはしていない）。イベント作成時に固定ページを
  自動で作る仕組みは、イベントを作る機能ができてから
- **個別ページはモックを描画するだけの仮ページにした。** 種類ごとのサマリー（#56〜#60）がまだ無く、
  パスの識別子を引く先がないため。`lib/mock/preview-articles.ts` は本実装で消す
- **ホームの配線確認ページ（TanStack Query + Zustand のデモ）は消した。** `useUiStore` と `exampleQuery` は
  使う場所が無くなったが、配線の見本として残してある

## テスト

| テスト                                 | 検証内容                                                                          |
| -------------------------------------- | --------------------------------------------------------------------------------- |
| `packages/schema/src/article.test.ts`  | slug の形式・長さ・予約語。記事オブジェクトが slug を持つこと                     |
| `apps/api/src/routes/articles.test.ts` | `GET /api/articles/slug/:slug` の 200 / 404 / 400（形式・`event_id` なし）/ 401   |
| `apps/api/rls/articles.test.ts`        | slug の一意性（イベント内）・形式・予約語、staff でないメンバーが書き換えないこと |
| `apps/web/src/pages/HomePage.test.tsx` | `/` が slug `home` を `event_id` つきで引くこと、404 の表示                       |
| `apps/web/src/pages/SlugPage.test.tsx` | パスの slug で引くこと、ページ見出しが h1 になること、404 の表示                  |
| `apps/web/src/router.test.tsx`         | `/settings` が固定ページより先に選ばれること、個別ページが仮ページを出すこと      |
| `apps/web/e2e/smoke.spec.ts`           | ホーム・`/news`・`/news/:postId` の通し                                           |

```
bun run format    ✅
bun run lint      ✅
bun run typecheck ✅
bun run test      ✅
bun run build     ✅
bun run e2e       ✅（web・lp とも chromium / mobile-safari）
bun run --filter @fesp/api test:rls ✅（101件）
```

## 詰まった点

`pages` テーブルを開発用プロジェクトに当てたあとで設計が変わったので、取り消しのマイグレーションを流して
`supabase migration repair --status reverted` で履歴から2件を消し、ファイルを作り直してから入れ直した。
リモートに当てたマイグレーションはファイルを書き換えても再実行されないため、DB 側を戻す SQL を別に流す必要がある。

## 残課題

- [ ] 管理者サイトの記事一覧を、ページ単位の導線に置き換える（#29 の残り）
- [ ] イベント作成時に固定ページを自動で作る（イベントを作る機能ができてから）
- [ ] 種類ごとのサマリーと個別ページの本実装（#56〜#60）
- [ ] ホーム・テンプレート・ロック（#63・#64）
- [ ] URL でイベントを見分ける（`/<event-slug>/...`。#38）
- [ ] ナビの表示名・並び順（#91 で必要になったら `articles` に足す）
