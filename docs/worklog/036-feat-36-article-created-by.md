---
title: 記事に作成者（created_by）を持たせる
issue: 36
branch: 'feat/#36-article-created-by'
date: 2026-09-15
---

# 036 feat: #36 記事に作成者（created_by）を持たせる

## やったこと

`articles.created_by`（NOT NULL、`users.id` を参照）と `users.display_name` を足し、記事 API のレスポンスに作成者（`created_by` + `creator: { display_name }`）を含めた。
作成者はトークンのユーザーで固定し、あとから変えられない。管理者サイトの記事エディタの見出しの下に「作成者: <表示名>」を出す。
他人の表示名を読めるよう、同じイベントのメンバー同士と、読める記事の作成者の `users` の行を読めるポリシーを足した。

## 変更したファイル

| ファイル                                                                  | 変更内容                                                                                                                                           |
| ------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| `docs/db.md` / `docs/api.md` / `docs/admin.md`                            | `created_by`・`display_name`・RLS・`private.shares_event_with`、記事オブジェクトの `created_by` / `creator`、エディタの作成者表示（別コミット）    |
| `supabase/migrations/20260915140000_add_created_by_to_articles.sql`       | 新規。既存記事の削除、`created_by` とインデックス、変えられなくするトリガー、insert ポリシーの置き換え、`display_name`、`users` の select ポリシー |
| `packages/types/src/database.generated.ts`                                | 再生成                                                                                                                                             |
| `packages/schema/src/article.ts`                                          | `articleCreatorSchema` を追加し、記事オブジェクトに `created_by` / `creator` を足した（一覧・ウェブアプリ用のスキーマにも入る）                    |
| `apps/api/src/routes/articles.ts`                                         | select を `creator:users!created_by(display_name)` を埋め込んだ列に。`POST` で `created_by` にトークンのユーザーを入れる                           |
| `apps/admin/components/articles/ArticleEditView.tsx`                      | 見出しの下に「作成者: <表示名>」。未設定なら「（名前未設定）」                                                                                     |
| `apps/api/rls/support.ts`                                                 | 記事をユーザーの後に作る（`created_by` のため）。片付けはイベント（記事）を先に消す                                                                |
| `apps/web/e2e/*.spec.ts` / `apps/web/src/pages/ArticlePage.test.tsx` など | 記事のフィクスチャに `created_by` / `creator` を足した                                                                                             |

## 実装メモ

- **レスポンスは `created_by`（id）と `creator: { display_name }` に分けた。** `created_by` は DB の列のまま、表示名は PostgREST の埋め込み（`creator:users!created_by(display_name)`）でそのまま返せる（発注者と合意）
- **表示名は `users.display_name`（NULL 可）に持つ。** 新規登録のトリガーで `raw_user_meta_data.full_name`（Google のアカウント名）を入れ、既存ユーザーもマイグレーションで埋めた。メールアドレスでの登録は `NULL` で、画面で「（名前未設定）」と出す。編集する画面は #42
- **デザインの「投稿者」（委員会のドロップダウン）とは別物として扱った。** 当面は作成者（個人）を「作成者」としてテキストで出す。委員会は #41（発注者と合意）
- **作成者は insert のポリシーで `created_by = auth.uid()` を要求する。** API はボディの `created_by` を受け取らない（zod で落ちる）が、RLS でも他人の名前で作れないようにした
- **作成者を変えられなくするのはトリガーにした。** update で渡されても `new.created_by := old.created_by` で元に戻す（エラーにはしない）。列ごとの update 権限で絞る案は、今後列を足すたびに grant を足す必要があるので見送った
- **`users` の select に2つのポリシーを足した。**
    - `private.shares_event_with(id)` … 同じイベントに所属しているメンバー（役割・相手の論理削除は問わない）。`is_event_member` と同じく `private` スキーマの `security definer` にし、RLS の再帰を避けた
    - 読める記事の `created_by` … 作成者がイベントを抜けても（`event_members` の行が消えても）記事の `creator` が `null` にならないようにするため。記事が読めるかは `articles` の RLS がそのまま効く。引くために `articles (created_by)` にインデックスを張った
- **`created_by` の外部キーは `on delete` を既定のままにした。** ユーザーは論理削除なので、記事を持つユーザーの行は物理削除できなくてよい。RLS テストの片付けはイベント（記事）→ ユーザーの順に変えた
- **一覧（`GET /api/articles`）にも作成者を含めた。** 画面には出さないが、記事オブジェクトの形を揃えるため
- **`GET /api/me` には `display_name` を足していない**（#42 で決める）
- マイグレーションの適用（`db push`）は、発注者の許可を取ってから実行した。fesp-dev の既存の記事は消えた

## テスト

| テスト                                                    | 検証内容                                                                                                                                                                                                            |
| --------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `packages/schema/src/article.test.ts`                     | 作成者つきの記事を受理、`display_name: null` を受理、`created_by` / `creator` が無ければ拒否                                                                                                                        |
| `apps/api/src/routes/articles.test.ts`                    | 一覧・取得・作成・更新で作成者を埋め込んだ列を select、`POST` の insert に `created_by` = トークンのユーザー（ボディの `created_by` は無視）、`PUT` で変えない                                                      |
| `apps/admin/components/articles/ArticleEditView.test.tsx` | 「作成者: 山田太郎」、表示名が `null` なら「作成者: （名前未設定）」                                                                                                                                                |
| `apps/api/rls/articles.test.ts`                           | staff でも自分以外を作成者にして作成できない、作成者を update しても元の値のまま                                                                                                                                    |
| `apps/api/rls/users.test.ts`                              | 同じイベントのメンバーの行を読める、所属なしは自分だけ・論理削除されたユーザーは他人を読めない・未ログインは読めない、イベントに所属していない作成者も記事と一緒に読める、`full_name` の有無で表示名が入る / `NULL` |

```
bun run format    ✅
bun run lint      ✅
bun run typecheck ✅
bun run test      ✅
bun run build     ✅
bun run e2e       ✅（web 8 / lp 4。admin は既存の skip 1）
bun run --filter @fesp/api test:rls  ✅（36件、fesp-dev）
```

## 詰まった点

- **web の e2e（`auth.spec.ts`）が「読み込みに失敗しました」で落ちた。** ルートでスタブしている記事のレスポンスに `created_by` / `creator` が無く、`articleViewResponseSchema` で弾かれていた。記事オブジェクトの形を変えたときは、`article.spec.ts` 以外の e2e のスタブも `grep` で探して直す

## 残課題

- [ ] 投稿者として委員会を選べるようにする（#41）
- [ ] ユーザーが表示名を編集できるようにする。`GET /api/me` に `display_name` を含めるかもここで決める（#42）
- [ ] ウェブアプリでの投稿者表示（#13 / #14。`users` を読むポリシーはそのまま使える）
- [ ] 本番用プロジェクトを作ったら、このマイグレーションを適用する
