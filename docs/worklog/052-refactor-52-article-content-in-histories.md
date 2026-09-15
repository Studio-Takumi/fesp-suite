---
title: 記事の中身を版（article_histories）だけに持たせる
issue: 52
branch: 'refactor/#52-article-content-in-histories'
date: 2026-09-16
---

# 052 refactor: #52 記事の中身を版（article_histories）だけに持たせる

## やったこと

記事のタイトル・本文を `article_histories` にだけ持たせ、`articles` は版を番号で指す（`latest_version` / `published_version`）形にした。`status` は `published_version` から決まる生成列にし、記事の作成は関数 `create_article` で記事と版1を1トランザクションで作るようにした。
API のリクエスト・レスポンスの形は変えず、画面は触っていない。予約投稿（#12）の土台。

## 変更したファイル

| ファイル                                                                        | 変更内容                                                                                                                                                                                                         |
| ------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `docs/db.md` / `docs/api.md`                                                    | `articles` の列・外部キー・RLS、`create_article`・`save_article`、版の RLS。`latest_history` を返す範囲と `updated_at` の進み方（別コミット）                                                                    |
| `supabase/migrations/20260916180000_move_article_content_to_histories.sql`      | 新規。既存の記事・版を消し、`title` / `content` を削除、`latest_version`・生成列 `status`、`create_article`、`save_article` の作り直し、公開日時のトリガー、版の RLS（公開中の版はメンバーが読める・上書き不可） |
| `packages/types/src/database.generated.ts`                                      | 再生成                                                                                                                                                                                                           |
| `apps/api/src/routes/articles.ts`                                               | 公開中の版・最新の版を外部キーで埋め込み、`title` / `content` を版から埋める。`POST` は `create_article` を呼んで読み直す                                                                                        |
| `apps/api/rls/support.ts`                                                       | フィクスチャの記事を staff の `create_article` で作るようにした。`createArticle` を追加                                                                                                                          |
| `apps/api/rls/articles.test.ts` / `article-histories.test.ts` / `users.test.ts` | 新しい形に合わせて書き直し                                                                                                                                                                                       |

## 実装メモ

- **中身は版にだけ置き、`articles` は番号だけを持つ。** `articles.title` / `content` の意味が公開状態で変わり、状態が増えるたびに「何を入れておくか」を決め直す必要があったため（発注者と合意）。`save_article` の公開状態の分岐は「`published_version` をどうするか」の3通りだけになった
- **既存の記事・版はデータを移さずに消した**（`truncate`。発注者と合意）。fesp-dev に `db push` した時点から、main からデプロイ済みの API はマージまで記事の読み書きで失敗する（本番プロジェクトは未作成なので許容。発注者と合意）
- **`latest_version` を持たせた。** 最新の版を外部キー1本で埋め込めるので、#11 で使っていた `order` / `limit` の `referencedTable` が要らなくなった。外部キーは `deferrable initially deferred` にして、`create_article` の中で記事 → 版1の順に作れるようにした
- **`status` は消さずに生成列にした**（発注者と合意）。RLS・一覧・API の書き方をほぼ変えずに済む。`published_at` のトリガーは before トリガーで、生成列はまだ計算されていないので `published_version` で判定する
- **`title` / `content` は API で選ぶ。** 公開中の版があればその版、なければ最新の版。下書きは staff にしか読めず staff は最新の版も読めるので、どちらも読めないことはない（読めなければ 500 にした）。一覧もタイトルだけ同じ選び方をする
- **`latest_history` は、staff でなくても最新の版が公開中の版なら返る。** 公開中の版は visitor も読める RLS にしたので、API では消せない。見えるのは公開済みの中身だけなので、仕様書の書き方を直した（発注者と合意）
- **`updated_at` は保存のたびに進むようにした。** `save_article` が毎回 `latest_version` / `published_version` を書くため。#11 の「一時保存では進まない」を変えた（発注者と合意）
- **公開中の版の上書き禁止を RLS でも守るようにした。** これまでは `save_article` の中の条件だけだった。`using` と `with check` の両方で「記事の `published_version` ではない」を見る
- **`save_article` の引数名は変えていない。** API の `PUT` は触らずに済んだ
- マイグレーションの適用（`db push`）と型の再生成は、発注者の許可を取ってから fesp-dev に実行した

## テスト

| テスト                                   | 検証内容                                                                                                                                                                                                                       |
| ---------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `apps/api/src/routes/articles.test.ts`   | 取得・一覧の列（版の埋め込み）、公開中の版 / 下書きなら最新の版から `title` / `content` を埋める、版がどちらも読めないと 500。`POST` で `create_article` に渡す引数（`created_by` / `status` は渡さない）、読み直し、403 / 500 |
| `apps/api/rls/articles.test.ts`          | `create_article` の権限（staff 以外・存在しないイベント・未ログイン）、版なしで記事を直接作れない、`status` は書き込めない、公開日時は初めて公開中の版が入ったときだけ                                                         |
| `apps/api/rls/article-histories.test.ts` | staff でないメンバーは公開中の版だけ読める、記事から公開中の版・最新の版を埋め込むと読めない版は `null`、公開中の版は直接上書きできない、存在しない版を最新・公開中にできない、`save_article` の版の残し方と公開状態の流れ     |
| `apps/api/rls/users.test.ts`             | 所属していない作成者の記事を、作る間だけ staff にして作るようにした（検証内容は変えていない）                                                                                                                                  |

```
bun run format    ✅
bun run lint      ✅
bun run typecheck ✅
bun run test      ✅
bun run build     ✅
bun run --filter @fesp/api test:rls  ✅（64件、fesp-dev）
```

画面は触っていないので `bun run e2e` は回していない。

## 詰まった点

- **RLS テストのフィクスチャを service_role で作れなくなった。** 記事と版1を同じトランザクションで作る必要があり、PostgREST からは1リクエストで2つのテーブルに書けないため。`create_article` は `auth.uid()` を作成者にするので service_role からも呼べない。staff に一時的に eventB の staff 権限を持たせて `create_article` で作り、作り終えてから visitor に戻した（`users.test.ts` の所属していない作成者も同じやり方）
- **「staff でも visitor として所属するイベントの版は読めない」のテストが落ちた。** 新しい RLS では、visitor として所属するイベントでも公開中の版は読めるのが正しい。テストの期待を「公開中の版だけ読める」に直した

## 残課題

- [ ] staff が PostgREST で `articles.latest_version` / `published_version` を直接書き換えることは防いでいない（存在しない版は外部キーで弾く）。API は必ず関数を通るので、今回はそのまま
- [ ] 予約投稿（#12）
