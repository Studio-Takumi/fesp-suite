---
title: 記事の予約投稿をできるようにする
issue: 12
branch: 'feat/#12-article-schedules'
date: 2026-09-16
---

# 012 feat: #12 記事の予約投稿をできるようにする

## やったこと

記事の版を指定した日時に公開する予約を `article_schedules` に持たせ、pg_cron で1分ごとに時間が来た予約を公開するようにした。下書きの公開予約も、公開中の記事の中身の差し替え予約も同じ仕組みで扱う。
管理者サイトの記事エディタから予約・取り消しができ、記事一覧で予約中の記事がわかる。

## 変更したファイル

| ファイル                                                                      | 変更内容                                                                                                                                                                                                                         |
| ----------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `docs/db.md` / `docs/api.md` / `docs/admin.md`                                | `article_schedules` と3つの関数、`save_article`・版の RLS・公開日時の変更、`schedule` と `PUT` / `DELETE /api/articles/:id/schedule`、エディタの予約・一覧の表示（別コミット）                                                   |
| `supabase/migrations/20260916200000_create_article_schedules.sql`             | 新規。`article_schedules` と RLS、`schedule_article` / `cancel_article_schedule` / `publish_scheduled_articles`、公開中の版が変わったら予約を消すトリガー、`save_article`・版の update の RLS・公開日時のトリガーの変更、pg_cron |
| `packages/types/src/database.generated.ts`                                    | 再生成                                                                                                                                                                                                                           |
| `packages/schema/src/article.ts`                                              | `articleScheduleSchema`、記事オブジェクト・一覧に `schedule`、`articlePublishAtSchema`（現在より後）・`articleScheduleInputSchema`。ウェブアプリ用の形からは `schedule` を除く                                                   |
| `apps/api/src/lib/errors.ts`                                                  | 409 の `conflict` を追加                                                                                                                                                                                                         |
| `apps/api/src/routes/articles.ts`                                             | 予約の埋め込み、`PUT` / `DELETE /:id/schedule`。関数が `false` のときに 403 / 404 を分ける読み直しを `readWrittenArticle` にまとめた                                                                                             |
| `apps/admin/components/ui/{calendar,popover}.tsx` / `apps/admin/package.json` | 追加。shadcn CLI で calendar / popover を足した（`react-day-picker` / `date-fns` が入る）                                                                                                                                        |
| `apps/admin/lib/queries.ts`                                                   | `useSaveArticle`（保存 → 予約、または保存 → 予約の取り消し）にまとめた                                                                                                                                                           |
| `apps/admin/components/articles/ArticlePublishAtField.tsx`                    | 新規。公開日時の入力欄（shadcn の Date Picker（Popover + Calendar）＋時刻の入力欄と「日時をクリア」）。カレンダーは日本語、選んだ日時は日本時間として扱う                                                                        |
| `apps/admin/components/articles/ArticleEditView.tsx` / `ArticleList.tsx`      | タイトルの下に公開日時の欄、タイトル・公開日時・本文のラベル、日時があるとき公開スイッチを無効化、公開中の記事のダイアログに反映日時。一覧の「予約中」「公開中（更新予約あり）」                                                 |

## 実装メモ

- **予約は `articles` の列ではなく `article_schedules` に持たせた**（発注者と合意）。RLS で staff にしか見えないので、visitor に予約の日時が漏れない。`articles` は今の状態だけを持つ
- **実行は pg_cron（1分ごと）**（発注者と合意）。公開の関数は `security definer` で RLS を通さず、`service_role` からだけ呼べる。止まっていた間の予約も次に動いたときにまとめて公開する
- **API は「版の番号 + その版の `updated_at`」で予約し、エディタは保存 → 予約の2リクエストにした**（発注者と合意）。`save_article` の「同じ人・30分以内なら上書き」で版の中身が変わることがあるので、見ていない中身を予約しないよう `schedule_article` で `updated_at` を照合する。記事の行をロックしてから照合するので、保存と同時に動いても照合した版が途中で上書きされない
- **版が合わないときは SQLSTATE `PT409` で失敗させた。** PostgREST が 409 にし、supabase-js の `error.code` にもそのまま入るので、API で `conflict` に変える
- **予約中の版は `save_article` の上書きの対象から外した。** 版の update の RLS で予約中の版を上書きできなくしたので、外さないと上書きが0件になり、保存は成功に見えて中身が残らない（設計の相談中に見つけて Issue に追記）
- **公開中の版が変わったら予約を消すトリガーは、値が変わったときだけ動く**（`after update of published_version ... when (old is distinct from new)`）。`save_article` は保存のたびに `published_version` を書くので、書き込みだけで消すと一時保存でも予約が消えるため
- **予約で初めて公開したときの `published_at` は `publish_at`**（発注者と合意）。公開日時のトリガーで「その版の予約があり、日時を過ぎていれば `publish_at`」とした。予約より前に手で同じ版を公開したときに未来の日時が入らないよう、日時を過ぎているかも見る
- **予約した版がすでに公開中の版だった予約も、公開の関数で消す。** `published_version` が変わらずトリガーが動かないため
- **予約の取り消しも関数（`cancel_article_schedule`）にした。** PostgREST の delete だと、staff でない・予約が無い、のどちらも0件になって 403 / 404 / 成功を分けられないため。保存と同じく `false` のときに読み直しで分ける
- **予約中にもう一度予約したら上書きする（1記事1予約）。取り消しは予約が無くても成功にした**（発注者と合意）
- **予約は専用のダイアログではなく、タイトルの下の「公開日時」で行う**（発注者と合意。はじめは「予約」ボタン＋ダイアログで作り、あとで置き換えた）。予約のためだけにダイアログを開くのが分かりにくいため。日時を入れて「保存」すると保存 → 予約、日時を空にして「保存」すると保存 → 予約の取り消しになる
- **保存・予約・予約の取り消しは1つの mutation（`useSaveArticle`）にまとめた。** 「保存しました」「保存して予約しました」「保存して予約を取り消しました」を1か所で出し分けられる。保存だけ成功して予約に失敗したときも最新の記事を出すよう、成否にかかわらず記事を読み直す
- **公開日時が入っている間は「公開」のスイッチを無効にする**（発注者と合意）。今すぐ公開するのか予約するのかが1つの「保存」で決まるので、どちらが効くのかを迷わせないため。今すぐ公開したいときは「日時をクリア」で空にする
- **公開中の記事で日時が入っているときも、今までのダイアログを出す**（発注者と合意）。本文に「YYYY/MM/DD HH:mm に公開へ反映されます。」を足し、「一時保存する」で予約、「公開に反映する」で今すぐ反映（予約は消え、日時の欄も空にする）
- **日時の入力は shadcn の Date Picker（Popover + Calendar）と時刻の入力欄にした**（発注者と合意。はじめは `datetime-local` で作り、あとで置き換えた）。本家に日時をまとめて選ぶ部品は無いので、日付はカレンダー・時刻は `<input type="time">` に分けている。`react-day-picker` と `date-fns` が増えた（発注者の許可を取って追加）
- **カレンダーは date-fns の `ja` ロケールで出し、見出しだけ `formatters` で上書きした。** ロケールの既定の見出しは `9月 2099` なので、`2099年9月` にした。曜日（日〜土）と読み上げ用のラベルはロケールのままでよい
- **カレンダーが返す日は端末のタイムゾーンの0時なので、年月日だけを取り出して日本時間の日時に組み立てる。** 端末のタイムゾーンによらず、選んだ見た目どおりの日時になる
- **ウェブアプリ用の形（`articleViewResponseSchema`）からは `schedule` を除いた。** 表示に使わず、ウェブアプリのテストのフィクスチャを増やさずに済む
- マイグレーションの適用（`db push`）と型の再生成は、発注者の許可を取ってから fesp-dev に実行した。pg_cron の拡張はマイグレーションで有効にできた

## テスト

| テスト                                                    | 検証内容                                                                                                                                                                                                                                                                                                                                                                                                                                |
| --------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `packages/schema/src/article.test.ts`                     | 予約つきの記事を受理、`schedule` が無い・版の番号が不正なら拒否。予約のボディは現在以前・オフセットなし・版の番号が不正なら拒否。ウェブアプリ用の形は予約を持たない                                                                                                                                                                                                                                                                     |
| `apps/api/src/routes/articles.test.ts`                    | 予約の埋め込みの列、`PUT /:id/schedule` の関数の引数・`PT409` で 409・403 / 404 / 500・過去の日時と不足で 400、`DELETE /:id/schedule` の引数と 403 / 404 / 500、401                                                                                                                                                                                                                                                                     |
| `apps/api/rls/article-schedules.test.ts`                  | 予約は staff だけ読める・埋め込みは読めなければ `null`、直接の作成・削除の権限、`schedule_article` の上書き・`updated_at` の照合（`PT409`）・staff 以外は `false`、予約中の版は `save_article` でも直接でも上書きされない、一時保存では消えず公開・下書きに戻す・取り消しで消える、公開の関数は日時を過ぎた予約だけ公開して `published_at` を `publish_at` にする・ユーザーからは呼べない                                               |
| `apps/admin/components/articles/ArticleEditView.test.tsx` | 公開予定と取り消しの表示・予約のあとの変更の注意書き、取り消しの DELETE、タイトル・公開日時・本文のラベル、予約があるときの初期値と公開予定、日時があるとスイッチが無効、下書きで日時を入れた保存 → 予約、日時のクリア → 予約の取り消し、片方だけ・現在以前のエラー、カレンダーの日本語表示（曜日・見出し）、公開中の記事のダイアログ（反映日時・一時保存する・公開に反映する）、409 のエラー、タイトルが長いとダイアログを閉じてエラー |
| `apps/admin/components/articles/ArticleList.test.tsx`     | 予約があると「予約中」「公開中（更新予約あり）」                                                                                                                                                                                                                                                                                                                                                                                        |

```
bun run format    ✅
bun run lint      ✅
bun run typecheck ✅
bun run test      ✅
bun run build     ✅
bun run e2e       ✅（web 8 / lp 4。admin は既存の skip 1）
bun run --filter @fesp/api test:rls  ✅（86件、fesp-dev）
```

## 詰まった点

なし。

## 残課題

- [ ] pg_cron が本当に毎分動いて公開することは、テストでは確かめていない（公開の関数を直接呼んで確かめた）。本番プロジェクトを作るときは、pg_cron の拡張とジョブ（`publish-scheduled-articles`）が入っているかを確認する
- [ ] 公開終了の予約・1記事に複数の予約・繰り返しの予約・通知（Issue の「やらないこと」）
