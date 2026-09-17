---
title: 管理者サイトの記事一覧に並べ替え・絞り込みを付ける
issue: 45
branch: 'feat/#45-article-list-sort-filter'
date: 2026-09-17
---

# 045 feat: #45 管理者サイトの記事一覧に並べ替え・絞り込みを付ける

## やったこと

TanStack Table で汎用のテーブル `components/data-table/DataTable.tsx` を作り、記事一覧をそれで組み直した。
タイトル・公開状態・更新日時での並べ替え、タイトル検索と公開状態での絞り込み、50件ずつのページ送りを、読み込んだ先頭100件に対してクライアント側で行う。

## 変更したファイル

| ファイル                                         | 変更内容                                                                                                  |
| ------------------------------------------------ | --------------------------------------------------------------------------------------------------------- |
| `apps/admin/components/data-table/DataTable.tsx` | 追加。`components/example/DataTable.tsx` を昇格。並べ替え・列の絞り込み・ページ送りを中の state で持つ    |
| `apps/admin/components/example/DataTable.tsx`    | 削除（+ test）                                                                                            |
| `apps/admin/components/articles/ArticleList.tsx` | DataTable で組み直し、検索欄と公開状態のセレクトをツールバーに置く                                        |
| `apps/admin/components/ui/select.tsx`            | 追加。`shadcn add select` の出力（依存は既存の `radix-ui` だけで、パッケージは増えていない）              |
| `apps/admin/test/setup.ts`                       | Radix の Select を開くための polyfill（`hasPointerCapture` / `releasePointerCapture` / `scrollIntoView`） |
| `apps/admin/README.md`                           | ディレクトリ構成の `DataTable.tsx` の場所を更新                                                           |
| `docs/admin.md`                                  | 記事一覧に並べ替え・絞り込み・ページ送りを追記                                                            |

## 実装メモ

- **並べ替え・絞り込み・ページングはクライアント側にした。** 最初は API 側（一覧用のビューを足してクエリで並べる）で方針を出したが、発注者と相談してクライアント側に変えた。取得は今まで通り先頭100件で、101件目以降は出ない
- **状態は URL に載せず、DataTable の中の `useState` に持つ**（発注者と合意）。編集画面から戻ると初期状態に戻る
- **DataTable は状態を持ち、絞り込みの UI は持たない。** 検索欄やセレクトは画面ごとに違うので、`toolbar={(table) => ...}` で呼ぶ側が組み、`column.setFilterValue` で絞り込む。絞り込み方は列定義の `filterFn`、並べ替えるかは `enableSorting` で列ごとに決める。example にあった全体検索（globalFilter）は外した
- **`enableSortingRemoval: false`。** 3回目のクリックで「並べ替えなし」に戻ると、API の返した順（更新日時の新しい順）に見えて紛らわしいので、昇順・降順の行き来だけにした
- **公開状態は `status` と `schedule` から4種類（`draft` / `scheduled` / `published_scheduled` / `published`）を求める列にした。** 配列の順番を並べ替えの昇順（下書き → 予約中 → 公開中（更新予約あり）→ 公開中）とセレクトの選択肢の順に兼ねさせている
- **更新日時の列は `Date` を返して `sortingFn: 'datetime'`、`sortDescFirst: true`。** 初期の並びが新しい順なので、最初のクリックは古い順になる
- **Radix の Select は空文字を値にできないので、「すべて」は `all` にし、選んだら `setFilterValue(undefined)` で絞り込みを外す**
- 絞り込みを変えたときに1ページ目に戻るのは、TanStack Table の `autoResetPageIndex`（既定で有効）に任せた

## テスト

| テスト                                                | 検証内容                                                                                                                                                     |
| ----------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `apps/admin/components/data-table/DataTable.test.tsx` | `initialSorting`、昇順・降順の切り替え（並べ替えなしに戻らない）、並べ替えない列、ツールバーからの絞り込み、0行の文言、ページ送り、絞り込みで1ページ目に戻る |
| `apps/admin/components/articles/ArticleList.test.tsx` | 初期は更新日時の新しい順、タイトル・公開状態・更新日時の並べ替え、公開状態4種類と「すべて」の絞り込み、検索との併用、絞り込んで0件の文言、50件のページ送り   |

```
bun run format    ✅
bun run lint      ✅
bun run typecheck ✅
bun run test      ✅
bun run build     ✅
```

画面の導線は変えていないので e2e は回していない。記事一覧はログインが必要で、ローカルの Supabase を起動していなかったので目視していない。

## 詰まった点

- **jsdom で Radix の Select を開くとエラーになる。** `hasPointerCapture` と `scrollIntoView` が jsdom に無いため。`test/setup.ts` に polyfill を足した

## 残課題

- [ ] 記事一覧の見た目を、ログインした状態で目視する（レビュー時）
- [ ] 記事が100件を超えたら API 側での並べ替え・絞り込み・ページングが要る（今回はやらないことにした）
