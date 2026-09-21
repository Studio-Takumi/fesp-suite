---
title: 共通のテーブル（開催日・場所・タグ）を作る
issue: 107
branch: 'feat/#107-common-tables'
date: 2026-09-22
---

# 107 feat: #107 共通のテーブル（開催日・場所・タグ）を作る

## やったこと

お知らせ・模擬店・出演者・スケジュールが揃って参照する土台として、`event_days` / `places` /
`tags` / `article_tags` の4テーブルと RLS を作り、一覧・作成・更新・削除の API と管理画面を足した。
記事に付けるタグをまとめて置き換える `PUT /api/articles/:id/tags` もここで実装している。

## 変更したファイル

| ファイル                                                                         | 変更内容                                                                                                 |
| -------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------- |
| `supabase/migrations/20260920100000_create_common_tables.sql`                    | 追加。4テーブル + RLS                                                                                    |
| `packages/types/src/database.generated.ts`                                       | 再生成                                                                                                   |
| `packages/schema/src/common.ts`                                                  | `eventQuerySchema` / `idParamSchema` を追加（記事以外からも使うため）                                    |
| `packages/schema/src/event-day.ts`                                               | 追加。開催日のスキーマ                                                                                   |
| `packages/schema/src/place.ts`                                                   | 追加。場所のスキーマと `sortOrderSchema`                                                                 |
| `packages/schema/src/tag.ts`                                                     | 追加。タグと `PUT /api/articles/:id/tags` のスキーマ                                                     |
| `apps/api/src/lib/pg-errors.ts`                                                  | 追加。Postgres のエラーコード                                                                            |
| `apps/api/src/lib/event-resources.ts`                                            | 追加。書けなかったときに 403 と 404 を分けるヘルパー                                                     |
| `apps/api/src/routes/event-days.ts` `places.ts` `tags.ts`                        | 追加。一覧・作成・更新・削除                                                                             |
| `apps/api/src/routes/articles.ts`                                                | `PUT /:id/tags` を追加。エラーコードの定数を共通のものに寄せた                                           |
| `apps/api/src/index.ts`                                                          | 3つのルートを `app.route()` で束ねた                                                                     |
| `apps/api/src/test/route-harness.ts`                                             | 追加。ルートのテストで使う supabase のモック                                                             |
| `apps/admin/components/layout/admin-nav-items.ts`                                | 下位項目（`children`）を追加                                                                             |
| `apps/admin/components/layout/AdminSidebar.tsx`                                  | 項目の描画を `NavRow` に切り出し、下位項目を字下げして出す                                               |
| `apps/admin/components/settings/`                                                | 追加。3画面と、並べ替えのリスト・共通の枠                                                                |
| `apps/admin/app/(dashboard)/{schedule/event-days,map/places,news/tags}/page.tsx` | 追加                                                                                                     |
| `apps/admin/lib/queries.ts`                                                      | 3リソースの queryOptions とミューテーション                                                              |
| `apps/admin/package.json`                                                        | `@dnd-kit/core` `@dnd-kit/sortable` `@dnd-kit/utilities` `@dnd-kit/modifiers` を追加（発注者の承認済み） |
| `docs/admin.md`                                                                  | サイドメニューの下位項目と、3画面の節を追記                                                              |

## 実装メモ

- **管理画面の置き場は、発注者の指示どおり親の下の下位項目にした。**
  開催日は `/schedule/event-days`、場所は `/map/places`、タグは `/news/tags`。
  親の3ページはまだ準備中なので、**親は準備中のまま下位項目だけ開ける**形にしている
  （`NavRow` は `implemented` を項目ごとに見るので、親子で別々に扱える）

- **403 と 404 の出し分けは、RLS の性質をそのまま使った。** メンバーなら行は読めるが staff でないと
  書けないので、更新・削除が0件だったときに「その行が読めるか」を確かめれば足りる。
  読めれば 403、読めなければ 404（無い・別のイベントのもの）。
  `routes/articles.ts` の `readWrittenArticle` と同じ考え方

- **ヘルパーは「投げるエラーを返す」形にした**（理由: `Promise<never>` を返す関数を `await` しても、
  TypeScript はそこから先を到達不能と見なさない。`throw await writeFailure(...)` にすると
  そのあとの `data` が非 null に絞り込まれる）

- **参照されている開催日・場所を消したときは、Postgres の外部キー違反（`23503`）を 409 に読み替えている。**
  件数を数える API は足していない（発注者の判断）。管理画面は 409 のメッセージをそのまま出す

- **開催日を消したら、後ろの行の `day` を1つずつ前へ詰める。** `day` はイベントごとに1から続く
  決まりなので、穴が開いたままにしない。詰める更新は削除が成功してから順に投げている

- **場所・タグの並べ替えは、確定した時点で `sort_order` を 0 から振り直し、値が変わる行だけ `PUT` する。**
  API が1件ずつの形なので、まとめて送る口は作っていない

- **`packages/schema/src/common.ts` に `eventQuerySchema` / `idParamSchema` を足した。**
  記事用の `articleEventQuerySchema` / `articleIdParamSchema` と同じ形だが、開催日・場所・タグから
  記事用の名前を import するのは読みにくいため。既存の記事のルートはそのままにしてある

- **ルートのテストの supabase のモックを `src/test/route-harness.ts` に切り出した。**
  `routes/articles.test.ts` は同じ仕組みを自前で持ったままにしてある（今回の範囲外なので触らない）

## テスト

| テスト                                               | 検証内容                                                                       |
| ---------------------------------------------------- | ------------------------------------------------------------------------------ |
| `apps/api/src/routes/event-days.test.ts`             | 認証・バリデーション・409（重複 / 参照）・403 と 404 の出し分け                |
| `apps/api/src/routes/places.test.ts`                 | 同上（場所は重複の 409 が無い）                                                |
| `apps/api/src/routes/tags.test.ts`                   | 同上と、`PUT /api/articles/:id/tags` の入れ替え・重複・違うイベントのタグ      |
| `apps/api/rls/common-tables.test.ts`                 | 他人のイベントの行が見えない・触れない。記事と違うイベントのタグを付けられない |
| `apps/admin/components/settings/settings.test.tsx`   | 3画面の読み込み・0件・即保存・追加・削除・`day` の詰め直し・409 の表示         |
| `apps/admin/components/layout/AdminSidebar.test.tsx` | 下位項目がリンクとして字下げして出ること                                       |

```
bun run format   ✅
bun run lint     ✅
bun run typecheck ✅
bun run test     ✅
bun run build    ✅
```

RLS テスト（`bun run --filter @fesp/api test:rls`）も fesp-dev に対して回して 113 件すべて通した。
`bun run e2e` はウェブアプリの導線を触っていないので流していない。

## 詰まった点

- **`Promise<never>` では到達不能と見なされない。** 「403 か 404 を投げるだけ」のヘルパーを
  `async function ...: Promise<never>` にしたら、呼び出しのあとで `data` が `null` のままになり
  型エラーになった。エラーを**返して**呼び出し側で `throw` する形に変えて解決した

- **ブロックを足したときと同じで、`it.each` の引数の数を間違えると型エラーになる。**
  `[値, 説明]` の配列を渡してコールバックで1つしか受け取っていなかった。説明を先頭に移し、
  `(_label, body)` の2つを受け取る形に直した

## 残課題

- [ ] `routes/articles.test.ts` の supabase のモックも `test/route-harness.ts` に寄せる
- [ ] 委員会（`committees`）のテーブルと API（#41）
- [ ] `event_days` の表示時間（タイムテーブルの上限・下限）の列（#58 のステップ5で足す）
- [ ] 親の3ページ（`/schedule` `/map` `/news`）は準備中のまま（#58 / #61 / #56）
