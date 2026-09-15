---
title: 記事 API を認証必須にし、イベントへの所属で読み書きを分ける
issue: 35
branch: 'feat/#35-articles-auth-event-members'
date: 2026-09-15
---

# 035 feat: #35 記事 API を認証必須にし、イベントへの所属で読み書きを分ける

## やったこと

`users` と `events` を多対多で結ぶ `event_members`（役割 `staff` / `visitor`）を作り、RLS を「JWT → ユーザー → 所属イベント」で判定する形に書き直した。
記事 API はログイン必須にして `service_role` をやめ、ユーザーのトークンで RLS に任せる。読み取りはメンバー、作成・更新は `staff` だけ。
RLS の結合テスト（fesp-dev に対して手元で実行）を作った。

## 変更したファイル

| ファイル                                                             | 変更内容                                                                                                              |
| -------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------- |
| `docs/db.md` / `docs/api.md` / `docs/app.md`                         | `event_members`・所属の判定・RLS、記事 API の認証と `event_id` の渡し方、403（別コミット）                            |
| `supabase/migrations/20260915130000_create_event_members.sql`        | 新規。enum `event_member_role`、`event_members`、`private.is_event_member` / `is_event_staff`、RLS の置き換え         |
| `packages/types/src/database.generated.ts`                           | 再生成                                                                                                                |
| `packages/schema/src/article.ts`                                     | `articleCreateInputSchema`（`POST` のボディ。`articleInputSchema` + `event_id`）を追加                                |
| `packages/schema/src/auth.ts`                                        | `app_metadata` のコメントを「所属はクレームに持たせない」に                                                           |
| `apps/api/src/routes/articles.ts`                                    | `requireAuth`・`createUserClient` に切り替え。`POST` の RLS 違反を 403、`PUT` の 0件を読み直して 403 / 404 に分ける   |
| `apps/api/rls/*` / `apps/api/vitest.rls.config.ts`                   | 新規。RLS の結合テストと、その fixture・設定                                                                          |
| `apps/api/package.json` / `tsconfig.json`                            | `test:rls` を追加、`rls/` を型チェックの対象に                                                                        |
| `apps/admin/lib/queries.ts`                                          | 記事の呼び出しを `authenticated: true` に。`GET /:id`・`PUT` のクエリを外し、`POST` はボディに `NEXT_PUBLIC_EVENT_ID` |
| `apps/web/src/lib/queries.ts`                                        | 記事の取得から `event_id` を外し、`authenticated: true` に                                                            |
| `docs/architecture.md` / `supabase/README.md` / `apps/api/README.md` | Auth Hook で `app_metadata` に埋める方針を、`event_members` を RLS で引く形に。RLS テストの回し方（発注者と合意）     |

## 実装メモ

- **所属は JWT に埋めず、RLS で `event_members` を引く。** ユーザーとイベントが多対多で、JWT に1つのイベントを持たせる形が成り立たないため（Issue で決定）。#6 の `app_metadata` のポリシーは drop して置き換えた
- **判定関数は `private` スキーマに置いた `security definer` の関数にした。** PostgREST に公開していないスキーマなので RPC から呼べない。`event_members` 自身の RLS を通さないので再帰もしない。`authenticated` には `usage` と `execute` だけ許可し、`public` からは `execute` を剥がした
- **判定では `users.deleted_at is null` も見る。** 論理削除されたユーザーの JWT がまだ有効でも、記事を読み書きさせないため（`GET /api/me` が 404 になるのと揃えた）
- **`articles` の delete ポリシーは消した。** 記事は論理削除しかしない（= update）ので、物理削除はログインユーザーに許さない。`deleted_at` と削除 API は削除を作る Issue で足す
- **`articles` の update は `with check` も `staff`。** `staff` でないイベントへ記事を移せないようにするため。API はそもそも `event_id` を更新しない
- **`POST` で RLS に弾かれたら 403。** `visitor`・所属なし・存在しないイベントのどれも同じ扱い（発注者と合意）。RLS の `with check` は外部キーより先に評価されるので、存在しないイベントも `23503` ではなく `42501` になる。外部キー違反を 404 にしていた処理は消した
- **`PUT` は、更新が0件のときだけ記事を select し直して 403 / 404 を分ける。** RLS の update は条件に合わない行を黙って飛ばすため、そのままだと `visitor` も 404 になる。成功時は1往復のまま
- **`GET /api/articles` は、所属していないイベントでも空の 200。** 存在しないイベントと同じ扱いで、追加の問い合わせをしない
- **`event_members` は自分の行だけ読める。** 他のメンバーを出す画面がまだ無いため。#36 で作成者の表示名が要るときに広げる
- **`event_members` は `created_at` / `updated_at` を持ち、脱退は行を消す。** 役割の型は enum にして、生成型を `'staff' | 'visitor'` にした
- **ウェブアプリの `VITE_EVENT_ID` は残した。** 読む場所は無くなったが、やめるのは #38 の範囲（発注者と合意）
- **RLS テストは `apps/api/rls/` に置き、`bun run test:rls` で手元から fesp-dev に対して回す。** `bun run test` と CI には含めない（`.dev.vars` の `SUPABASE_SERVICE_ROLE_KEY` が必要なため。発注者と合意）。ユーザーのクライアントは API の `createUserClient` をそのまま使い、API と同じ経路で確かめる。`.dev.vars` は `node:util` の `parseEnv` で読み、依存パッケージは足していない
- **fesp-dev の開発用イベント（`slug: dev`）に、既存のユーザー全員（1人）を `staff` で入れた**（発注者と合意）。service_role で `event_members` に upsert した
- マイグレーションの適用（`db push`）は、発注者の許可を取ってから実行した

## テスト

| テスト                                      | 検証内容                                                                                                                                                                              |
| ------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `packages/schema/src/article.test.ts`       | `articleCreateInputSchema` の `event_id` 必須・タイトルの空白除去                                                                                                                     |
| `apps/api/src/routes/articles.test.ts`      | 4エンドポイントともトークンなし・無効で 401、ユーザーのトークンで読む、`GET /:id`・`PUT` に `event_id` の絞り込みが無い、`POST` の `42501` で 403、`PUT` の読み直しで 403 / 404 / 500 |
| `apps/admin/components/articles/*.test.tsx` | 呼び出す URL・`authenticated: true`・`POST` のボディの `event_id`、作成・保存が 403 のときのエラー表示                                                                                |
| `apps/web/src/pages/ArticlePage.test.tsx`   | `Authorization` を付け、クエリ無しで記事を取得する                                                                                                                                    |
| `apps/api/rls/articles.test.ts`             | events・articles の読み取り（役割を問わずメンバーだけ）、作成・更新は `staff` だけ、別イベントへ移せない、物理削除できない、論理削除されたユーザー・未ログイン                        |
| `apps/api/rls/event-members.test.ts`        | 自分の所属だけ読める、自分を参加させる・役割を変える・所属を消すことができない、判定関数を RPC から呼べない                                                                           |
| `apps/api/rls/users.test.ts`                | 自分の行だけ読める、作成・更新・削除できない（#8 の残課題）                                                                                                                           |

RLS テストの fixture は、イベント2つ（A / B）とユーザー4人（A の staff かつ B の visitor・A の visitor・所属なし・論理削除済みの A の staff）。
ファイルごとに作って、終わったら消す。

```
bun run format    ✅
bun run lint      ✅
bun run typecheck ✅
bun run test      ✅
bun run build     ✅
bun run e2e       ✅（web 8 / lp 4。admin は既存の skip 1）
bun run --filter @fesp/api test:rls  ✅（29件、fesp-dev）
```

### 動作確認（API + fesp-dev）

モックなしの `app.request()` を fesp-dev に繋ぎ、一時ユーザー（staff / visitor / 所属なし）で叩いた。確認後、一時ユーザー・イベントは残っていない。

| 観点                               | 結果  |
| ---------------------------------- | ----- |
| staff が作成                       | `201` |
| トークンなしで一覧                 | `401` |
| visitor が一覧（1件）・取得        | `200` |
| 所属なしが一覧（0件）              | `200` |
| 所属なしが取得・更新               | `404` |
| visitor・所属なしが作成            | `403` |
| staff が存在しないイベントに作成   | `403` |
| staff が更新                       | `200` |
| visitor が更新（中身は変わらない） | `403` |
| staff が存在しない記事を更新       | `404` |

## 詰まった点

- **`supabase gen types` の出力は prettier が当たっていない。** そのまま置くと差分が数百行になる。生成後に `bunx prettier --write packages/types/src/database.generated.ts` をかける
- **supabase-js の Auth のレスポンス（`createUser` / `signInWithPassword`）は、`data` と `error` の組の union 型。** DB の結果と同じ汎用ヘルパーに渡すと型が合わない。`error` で絞り込んでから `data.user` / `data.session` を読む形にした
- **Bash を並列で走らせたとき、片方の `cd` がもう片方の作業ディレクトリに影響し、`test:rls` が「Script not found」になった・ステップ7が `apps/api` だけで走った。** ステップ7はルートから単独で通し直した

## 残課題

- [ ] ウェブアプリの `VITE_EVENT_ID` をやめる（#38）
- [ ] 作成者の表示名のため、同じイベントのメンバー同士で `users` / `event_members` を読めるようにする（#36）
- [ ] 記事の論理削除（`articles.deleted_at`）と削除 API（削除を作る Issue で）
- [ ] ユーザーをイベントに参加させる導線（当面は service_role で `event_members` に手で入れる）
- [ ] 本番用プロジェクトを作ったら、このマイグレーションを適用し、運営のユーザーを `event_members` に入れる
- [ ] RLS を触るマイグレーションのあとは、手元で `bun run --filter @fesp/api test:rls` を回す（CI では動かない）
