---
title: 記事の保存先（API / DB）を作る
issue: 6
branch: 'feat/#6-articles-api-db'
date: 2026-09-14
---

# 006 feat: #6 記事の保存先（API / DB）を作る

## やったこと

イベント（テナント）と記事本文のテーブルを RLS 付きで作り、記事の一覧・取得・作成・更新の API を足した。
管理者サイトに記事一覧（`/articles`）と記事エディタ（`/articles/[id]`）を作り、#5 のエディタを保存先に繋いだ。

着手前の相談で、固定ページ（`pages`）・slug・URL は #29 に切り出し、記事は slug を持たず `id` で引く形にした。
認証は #8 までの仮置きで、申し送りは #8 / #29 にコメントで残してある。

## 変更したファイル

| ファイル                                                            | 変更内容                                                               |
| ------------------------------------------------------------------- | ---------------------------------------------------------------------- |
| `docs/api.md` / `docs/db.md` / `docs/admin.md`                      | 記事 API・`events` / `articles`・記事一覧/エディタの仕様（別コミット） |
| `supabase/migrations/20260914120000_create_events_and_articles.sql` | 新規。`events` / `articles`・`updated_at` トリガー・RLS ポリシー       |
| `packages/types/src/database.generated.ts`                          | 新規。Supabase の生成型                                                |
| `packages/types/src/database.ts`                                    | 仮の型を生成型の再エクスポートに置き換え                               |
| `packages/schema/src/article.ts`                                    | 記事オブジェクト・一覧・クエリ・パス・ボディの zod スキーマを追加      |
| `packages/schema/src/article.test.ts`                               | 追加したスキーマのテスト                                               |
| `apps/api/src/routes/articles.ts`                                   | 新規。`GET /api/articles` `GET /api/articles/:id` `POST` `PUT`         |
| `apps/api/src/routes/articles.test.ts`                              | 新規。ルートのテスト                                                   |
| `apps/api/src/index.ts`                                             | `app.route('/api/articles', articlesRoute)` で束ねる                   |
| `apps/api/src/lib/supabase.ts`                                      | クライアントに `Database` 型を付ける                                   |
| `apps/api/README.md` / `supabase/README.md`                         | 「サンプルのみ」「スキーマ未作成」の記述を実態に合わせる               |
| `apps/admin/components/articles/ArticleList.tsx`                    | 新規。記事一覧（新規作成ボタン・テーブル）                             |
| `apps/admin/components/articles/ArticleEditView.tsx`                | 新規。記事の読み込み・404表示・保存ボタン                              |
| `apps/admin/components/articles/*.test.tsx`                         | 新規。一覧・エディタ画面のテスト                                       |
| `apps/admin/app/(dashboard)/articles/page.tsx` / `[id]/page.tsx`    | 新規。各ページの入口                                                   |
| `apps/admin/app/(dashboard)/edit/page.tsx`                          | 削除（`/articles/[id]` に置き換え）                                    |
| `apps/admin/lib/queries.ts`                                         | 記事の queryOptions / useMutation を追加                               |
| `apps/admin/lib/env.ts` / `.env.example` / `.env.test`              | `NEXT_PUBLIC_EVENT_ID` を追加                                          |
| `.env.example`                                                      | `NEXT_PUBLIC_EVENT_ID` を追記                                          |
| `.github/workflows/ci.yml` / `deploy.yml`                           | `NEXT_PUBLIC_EVENT_ID`（CI はダミー値、deploy は `vars`）を追加        |

## 実装メモ

- **API は `service_role` で接続し、すべてのクエリで `event_id` を絞り込む。** #8 まで JWT に `app_metadata.event_id` が
  無く、RLS を通るリクエストが作れないため（発注者と合意済み）。RLS ポリシー自体は本番の形で書いた
- **別イベントの記事は 403 ではなく 404 にした。** 仕様どおり。存在自体を他イベントに漏らさないため
- **`POST` で存在しないイベントを指定したときは、外部キー違反（`23503`）を 404 に変換する。** 事前に `events` を引くと
  1往復増えるため
- **RLS ポリシーは `(select auth.jwt() ...)` の形で書いた。** 行ごとではなく文ごとに1回だけ評価させるため
  （Supabase 推奨の書き方）。`set_updated_at()` は `search_path = ''` を付けて検索パスの差し替えを防ぐ
- **`content` を DB に渡すときだけ `as Json` にキャストした。** `ArticleBlock` の `props` が `Record<string, unknown>` で、
  生成型の `Json` に代入できない。中身は zod で検証済み
- **`/articles/[id]` はページ側で `useParams` + `next/dynamic`（`ssr: false`）にし、画面本体は `ArticleEditView` に分けた。**
  BlockNote が `window` に依存するため。本体を分けたのでテストから直接 render できる
- **「保存しました」は、その後に本文を編集したら消す。** 保存後に手を入れても表示が残ると、保存済みに見えてしまうため
- **デザイン（`ui-design.pen`）には「admin / 記事エディタ」「admin / ニュース一覧」がある。** 仮ページは見出し＋右上の
  ボタン＋テーブルの形だけ合わせた。エディタの右サイドパネル・パンくず・プレビューは後続 Issue の範囲なので入れていない
- **開発用イベントを fesp-dev に1件入れた**（`slug: dev`、`id: 3718a7ab-a3a2-4a07-8876-8cf13801ef7f`）。
  service_role で PostgREST に insert した。ローカルの `apps/admin/.env` にこの id を設定済み
- 型は `bunx supabase gen types typescript --linked --schema public` で生成した

## テスト

| テスト                                                    | 検証内容                                                                                                    |
| --------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------- |
| `packages/schema/src/article.test.ts`                     | ボディ（空の本文の受理・不正な本文の拒否）、一覧クエリの既定値と `event_id` 必須、Supabase の日時形式の受理 |
| `apps/api/src/routes/articles.test.ts`                    | 各エンドポイントのクエリ組み立て（`event_id` の絞り込み・並び順・範囲）、400 / 404 / 500 の分岐             |
| `apps/admin/components/articles/ArticleList.test.tsx`     | env のイベントで先頭100件を取得・行のリンク・0件表示・新規作成→遷移                                         |
| `apps/admin/components/articles/ArticleEditView.test.tsx` | 記事の読み込み・404 のときの表示・保存成功/失敗の表示                                                       |

API のテストは supabase-js のクエリビルダーを Proxy の偽物に差し替え、呼ばれたメソッドと引数を検証している。

```
bun run format    ✅
bun run lint      ✅
bun run typecheck ✅
bun run test      ✅
bun run build     ✅
bun run e2e       admin ✅ / web・lp の mobile-safari のみ ❌（ローカルに WebKit が無いため。Chromium は ✅）
```

### RLS の手動確認（fesp-dev）

`app_metadata.event_id` 付きの一時ユーザーを `auth.admin.createUser` で作ってサインインし、PostgREST 経由で確認した。
確認用のイベント・記事・ユーザーは確認後に削除済み。

| 観点                                              | 結果 |
| ------------------------------------------------- | ---- |
| events: 自分のイベントだけ見える                  | ✅   |
| articles select: 別イベントの記事が見えない       | ✅   |
| articles insert: 別イベントには作れない           | ✅   |
| articles insert: 自分のイベントには作れる         | ✅   |
| articles update: 別イベントの記事は更新されない   | ✅   |
| articles update: 自分の記事を別イベントへ移せない | ✅   |
| articles delete: 別イベントの記事は消えない       | ✅   |
| articles update: 自分のイベントの記事は更新できる | ✅   |
| クレームなしのユーザーは何も見えない              | ✅   |
| 未ログイン（anon）は何も見えない                  | ✅   |

### 動作確認（ローカル + fesp-dev）

- curl: 作成 201 / 取得 200 / 更新 200 / 別イベント指定の取得・更新 404 / 存在しないイベントへの作成 404 / 不正な本文 400
- ブラウザ（Playwright で操作）: 一覧 → 新規作成で編集画面へ移動 → 入力して保存 →「保存しました」→ 編集で表示が消える →
  再読み込みで保存した本文だけ残る → 一覧に並ぶ → リンクから開ける → 存在しない id で「記事が見つかりません」

## 詰まった点

- **`supabase/.temp/linked-project.json` があるのに、CLI が「リンクされていない」と言う。** `bunx supabase link --project-ref <ref>`
  をやり直したら通った
- **API テストの偽の DB エラーを素のオブジェクトにしたら、500 にならずテストが落ちた。** Hono の `onError` は `Error` の
  インスタンスしか拾わない。本物の `PostgrestError` は `Error` を継承しているので、テスト側も `Error` にして揃えた
- **Playwright の `getByText` が本文と確認用 JSON の2か所に当たって止まった。** ロケーターをエディタ（`本文エディタ`）の中に絞った

## 残課題

- [ ] GitHub の Variables に `NEXT_PUBLIC_EVENT_ID` を登録する（`deploy.yml` が参照する。発注者が行う）
- [ ] デプロイ先の API に `SUPABASE_SERVICE_ROLE_KEY` が登録されているか確認し、無ければ `bunx wrangler secret put SUPABASE_SERVICE_ROLE_KEY`
- [ ] 認証を入れ、`event_id` クエリ・`service_role`・env 固定をやめる（#8）
- [ ] RLS の自動テスト（#8）
- [ ] 固定ページ・slug・URL と、仮の記事一覧の置き換え（#29）
