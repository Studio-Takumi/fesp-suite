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

### レビュー対応: 日時表示の共通関数（`dateFormatter`）

発注者が書いた `dateFormatter`（`YYYY/MM/DD HH:mm` のようなトークン置換）を、日時表示の共通関数として
`packages/ui/src/lib/date-formatter.ts` に切り出し、`@fesp/ui` から export した。記事一覧の更新日時もこれで出す。
「日時を画面に出すときはこれを使う」ルールは `docs/conventions.md` に追記した。

- **置き場所は `@fesp/ui`。** LP・ウェブアプリ・管理者サイトの3つとも依存しており、ウェブアプリのニュース・ブログでも使うため
- **常に日本時間で出す**（`Intl.DateTimeFormat` の `formatToParts` を `Asia/Tokyo` 固定で使う）。`getHours()` などは
  閲覧端末のタイムゾーンに依存し、海外の端末や UTC で動くサーバー側で時刻がずれるため
- **曜日トークン `EEE`（日〜土）を足した。** `dd` が日の意味で使われているので、Unicode の日付パターンに合わせて `E` にした
- **トークンは正規表現1回で置き換える。** 元の `.replace('HH', …)` は最初の1つしか置き換えず、`HH:mm〜HH:mm` の2つ目が残るため
- **ISO 文字列もそのまま受け取る。** API の日時は文字列で返るので、呼び出し側で `new Date()` しなくて済むようにした
- JSX を返す版は、使う画面が出てきたら足す

### レビュー対応: 記事にタイトルを持たせる

一覧で記事IDではなくタイトルを出すため、`articles.title`（`text not null default ''`、100文字まで）を足した。
一覧はタイトル（リンク）＋更新日時、エディタは本文の上にタイトルの入力欄を置き、保存ボタンで本文と一緒に PUT する。

- **設計の変更として扱い、方針の合意 → 仕様書（別コミット）→ 実装の順でやり直した。** `docs/article-system.md` の
  「タイトルはサマリー側」も「タイトルは `articles`、サマリーはタイトル以外の一覧用情報」に書き換えた
- **タイトルは空を許す。** 必須にすると「新規作成で空の記事を作ってすぐ編集画面へ」の流れが作れず、実装がややこしくなるため
  （発注者と合意）。一覧では空のタイトルを「（無題）」と出す
- **マイグレーションは新しいファイル（`20260914140000_add_title_to_articles.sql`）で足した。** 適用済みのものは書き換えない。
  DB 側にも `check (char_length(title) <= 100)` を付けた
- **タイトルは zod の `.trim()` で前後の空白を取り除いてから長さを見る。** API と管理画面で同じ `articleInputSchema` を使う
- **管理画面のタイトル入力は React Hook Form + 共有 zod（`articleInputSchema.pick({ title: true })`）。** 既存のフォームの書き方に揃えた
- **エディタ（BlockNote）はフォームの外に置いた。** ツールバーのボタンが `type` 未指定だと、フォームの送信が起きてしまうため
- ブラウザ（Playwright で操作、fesp-dev）で確認: 新規作成直後はタイトルが空 → タイトルと本文を保存 → 再読み込みで前後の空白を
  除いたタイトルが残る → 101文字はエラーで保存されない → 一覧にタイトルと「（無題）」が並び、記事IDは出ない → タイトルのリンクから開ける

### レビュー対応: タイトル欄とボタンの見た目

- **タイトルの入力欄は独自のクラスを外し、shadcn の Input の見た目のままにした**
- **ボタン（保存・新規作成など）の色を赤から水色にした。** 赤は削除など別の意味に見えるため。赤の正体は共通プリセット
  （`packages/config/tailwind/preset.css`）の `--primary` で、LP・ウェブアプリも読んでいる。他アプリの色を変えないよう、
  `apps/admin/app/globals.css` で管理者サイトだけ `--primary` / `--ring` を sky-500（ダークは sky-400）に上書きした

## テスト

| テスト                                                    | 検証内容                                                                                                                                                                  |
| --------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `packages/schema/src/article.test.ts`                     | ボディ（空の本文の受理・不正な本文の拒否）、一覧クエリの既定値と `event_id` 必須、Supabase の日時形式の受理                                                               |
| `apps/api/src/routes/articles.test.ts`                    | 各エンドポイントのクエリ組み立て（`event_id` の絞り込み・並び順・範囲）、400 / 404 / 500 の分岐                                                                           |
| `apps/admin/components/articles/ArticleList.test.tsx`     | env のイベントで先頭100件を取得・行のリンク・0件表示・新規作成→遷移                                                                                                       |
| `apps/admin/components/articles/ArticleEditView.test.tsx` | 記事の読み込み・404 のときの表示・保存成功/失敗の表示                                                                                                                     |
| （タイトル追加）schema / API / 管理画面の各テスト         | タイトルの空許可・前後空白の除去・101文字の拒否、select / insert / update に `title` が入る、一覧のタイトルリンクと「（無題）」、エディタのタイトル入力・保存・エラー表示 |
| `packages/ui/src/lib/date-formatter.test.ts`              | 各トークン・曜日・日本時間への変換（日付またぎ）・0時表記・同じトークンの複数回置換・トークン以外の文字                                                                   |

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
