---
title: 記事の変更履歴を残す
issue: 11
branch: 'feat/#11-article-histories'
date: 2026-09-16
---

# 011 feat: #11 記事の変更履歴を残す

## やったこと

記事を保存するたびに、タイトル・本文を版として `article_histories` に残すようにした（一直線。枝分かれしない）。`articles` には公開中の中身（下書きなら最新の版）を持ち、公開中の記事は「一時保存」で公開中の中身を変えずに編集を残せる。
記事エディタは最新の版を開き、公開中の記事を公開のまま保存するときはダイアログで「一時保存する」「公開に反映する」を選ぶ。巻き戻しと履歴を見る画面は作らない（発注者と合意）。

## 変更したファイル

| ファイル                                                                                      | 変更内容                                                                                                                                                                                   |
| --------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `docs/db.md` / `docs/api.md` / `docs/admin.md`                                                | `article_histories`・`articles.published_version`・`save_article`、記事オブジェクトの `latest_history`・`PUT` の版の残し方と公開状態、エディタの初期値とダイアログ（別コミット）           |
| `supabase/migrations/20260916120000_create_article_histories.sql`                             | 新規。`article_histories` と RLS、`published_version` と複合外部キー、版1を作るトリガー、`save_article`、既存の記事の版1                                                                   |
| `packages/types/src/database.generated.ts`                                                    | 再生成                                                                                                                                                                                     |
| `packages/schema/src/article.ts`                                                              | `articleHistorySchema` を追加。記事オブジェクトに `published_version` / `latest_history`。一覧とウェブアプリ用の形からは `latest_history` を除く。`PUT` のボディの `status` を省略可にした |
| `apps/api/src/routes/articles.ts`                                                             | 取得・作成で最新の版を埋め込む。`PUT` は `save_article` を呼び、`false` なら従来どおり読み直しで 403 / 404 を分ける                                                                        |
| `apps/admin/components/ui/alert-dialog.tsx`                                                   | 追加。shadcn/ui の AlertDialog（`radix-ui` は導入済み。依存パッケージは増やしていない）                                                                                                    |
| `apps/admin/components/articles/ArticleEditView.tsx`                                          | 初期値を最新の版に。公開中の記事を公開のまま保存するとダイアログ。「公開していない変更があります」の表示                                                                                   |
| `apps/api/rls/article-histories.test.ts`                                                      | 新規。版の RLS と `save_article` の結合テスト                                                                                                                                              |
| `apps/web/e2e/*.spec.ts` / `apps/web/src/pages/ArticlePage.test.tsx` / `ArticleList.test.tsx` | 記事のフィクスチャに `published_version` を足した                                                                                                                                          |

## 実装メモ

- **`articles` は公開中の中身、版は `article_histories` に分けた。** ウェブアプリは今までどおり `articles` だけを読めばよく、公開中の記事を裏で編集しても公開中の中身は変わらない。下書きは公開されないので `articles` にそのまま入れる（発注者と合意）
- **API は `PUT` 1本のまま。** 公開状態は「省略（公開状態を変えない = 公開中なら一時保存）/ `published` / `draft`」の3通りで表す。「公開中のまま、公開に出さずに保存する」を表すには2値では足りないため `status` を省略可にした
- **版の追加と `articles` の更新は、Postgres の関数 `save_article` で1トランザクションにした。** API から2回に分けて書くと、途中の失敗や同時保存で版番号がずれたり片方だけ書かれたりするため。security invoker なので RLS はそのまま効く。最初に `select ... for update` で記事の行をロックして版番号の競合を防ぐ（`for update` は update のポリシーも通すので、staff でなければ行が返らず `false`）。API から RPC を呼ぶのはこのリポジトリで初めて（発注者と合意）
- **版の上書き（行の節約）は「同じ人・版を作ってから30分以内・公開中の版ではない」。** 30分は Issue の「前回の保存から」を `created_at` で判定するようにした。最後に保存した時刻（`updated_at`）で判定すると、30分以内に保存し続ける限り1つの版が延々と上書きされるため。公開中の版は、公開した中身を履歴から消さないよう上書きしない。変更量（どれだけ書き換えたか）は判定に使わない（曖昧になるため。発注者と合意）
- **版1は `articles` の after insert トリガーで作る。** 記事の作成が `articles` の RLS を通っているので、トリガーは security definer にして版の RLS を通さない。`published` で作った記事（RLS テストのフィクスチャ・service_role）は `published_version` を 1 にする
- **`status` と `published_version` の整合を check 制約にはしなかった。** `published` で insert した時点では版がまだ無く、制約が insert で落ちるため。整合は `save_article` と作成時のトリガーで保つ。存在しない版を指せないことだけ、複合外部キー `(id, published_version) → article_histories (article_id, version)` で守る
- **`article_histories.title` にも100文字の check を付けた。** 一時保存は `articles` を更新しないので、`articles` の check では弾けないため
- **一時保存では `articles.updated_at` が進まない。** 管理者サイトの一覧の並び順は変わらない（発注者と合意）
- **最新の版は PostgREST の埋め込みで1件だけ取る。** `articles` と `article_histories` の間に外部キーが2本あるので `article_histories!article_histories_article_id_fkey` と指定し、`order` / `limit` の `referencedTable` に別名（`latest_history`）を渡す。埋め込みは配列で返るので、API で先頭（無ければ `null`）にする。版は staff にしか読めないので、visitor には `null` になる。別名で並べ替え・件数を指定できることは、fesp-dev に一時的な記事を作って確かめた
- **ウェブアプリ用の形（`articleViewResponseSchema`）からは `latest_history` を除いた。** 本文は `parseArticleDocument` で前方互換に読むが、版の本文は厳密に検証されるので、staff が新しいブロックを含む記事をウェブアプリで開くと落ちてしまうため。ウェブアプリは版を使わない
- **ダイアログを出すかどうかは、フォームの値ではなく読み込んだ記事（保存後は保存の結果）の公開状態で決める。** 下書きの記事でスイッチをオンにして保存するのは初めての公開なので、ダイアログは出さない
- フォームのスキーマは `articleInputSchema.pick(...).required()` にした。`status` が省略可になったが、フォームでは常にスイッチの値がある
- マイグレーションの適用（`db push`）と型の再生成は、発注者の許可を取ってから fesp-dev に実行した

## テスト

| テスト                                                    | 検証内容                                                                                                                                                                                                                                                     |
| --------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `packages/schema/src/article.test.ts`                     | `PUT` のボディの `status` は省略できる。記事オブジェクトは `latest_history: null`・版の `created_by: null` を受理し、`published_version` / `latest_history` が無い・版の本文が不正なら拒否。ウェブアプリ用の形は版を持たない（不正な版でも落ちない）         |
| `apps/api/src/routes/articles.test.ts`                    | 取得の列・最新の版の並べ替えと件数、版が読めないと `null`。`PUT` で `save_article` に渡す引数（`status` 省略時は渡さない、`event_id` などは渡さない）、`false` のときの 403 / 404、関数のエラーは 500                                                        |
| `apps/api/rls/article-histories.test.ts`                  | 版は staff だけ読める。記事を作ると版1。版を直接足す・消すことはできない、存在しない版は公開中にできない。`save_article` は staff 以外なら `false` で何も変えない。上書き・同じ中身・別の人・30分超過の分岐。公開 → 一時保存 → 公開に反映 → 下書きに戻す     |
| `apps/admin/components/articles/ArticleEditView.test.tsx` | 最新の版（無ければ記事）を初期値にする。「公開していない変更があります」の出し分け。公開中の記事でスイッチがオンのまま保存するとダイアログ、「一時保存する」は `status` なし・「公開に反映する」は `published`・「キャンセル」は保存しない。オフなら出さない |

```
bun run format    ✅
bun run lint      ✅
bun run typecheck ✅
bun run test      ✅
bun run build     ✅
bun run e2e       ✅（web 8 / lp 4。admin は既存の skip 1）
bun run --filter @fesp/api test:rls  ✅（60件、fesp-dev）
```

## 詰まった点

- **`shadcn add alert-dialog` が `button.tsx` を上書きするか聞いて止まった。** alert-dialog が button に依存しているため。`--yes` では止まったままで、標準入力に `n` を渡して上書きせずに足した。生成されたファイルはダブルクォートなので、format で揃う
- **`articleInputSchema` の `status` を省略可にし忘れ、API の「`status` 省略で 200」とエディタの型が落ちた。** スキーマの変更を複数の編集に分けたときに1つ抜けた
- **`supabase gen types` が自動モードで「本番デプロイ」と判定されて止められた。** 実際は fesp-dev のスキーマを読むだけ。発注者の許可を取ってから実行した

## 残課題

- [ ] 巻き戻し・履歴を見る画面（今回はスコープ外。運用でカバーする）
- [ ] staff が PostgREST で `articles` を直接更新すると、版が残らない（`save_article` を通らない）。API は必ず関数を通るので、今回はそのままにした
- [ ] 予約投稿（#12）で自動公開するときは、`save_article` を通すか `published_version` も合わせて更新する
