---
title: 独自コンポーネントの一覧まわりの重複を共通化する
issue: 79
branch: 'refactor/#79-list-component-dedupe'
date: 2026-09-18
---

# 079 refactor: #79 独自コンポーネントの一覧まわりの重複を共通化する

## やったこと

#13〜#20 を並列で実装したときにできた、一覧まわりの同じコードを1つにまとめた。
schema の ID の並びのパーサ、ウェブアプリのタグタブ・日付タブ・検索・並び替え・絞り込み・カードの色、
管理者サイトのチェックボックス群とスイッチを、それぞれ共通の部品にした。見た目と振る舞いは変えていない。

## 変更したファイル

| ファイル                                                   | 変更内容                                                                                        |
| ---------------------------------------------------------- | ----------------------------------------------------------------------------------------------- |
| `packages/schema/src/article.ts`                           | `parse*Tags` / `parseProductListIds` を `parseIdListProp` にまとめ、`idListSchema` も共通にした |
| `apps/web/src/components/list/ListTagTabs.tsx`             | 追加。タグのタブ（先頭に「すべて」）。`ALL_TAB` もここから出す                                  |
| `apps/web/src/components/list/ListDateTabs.tsx`            | 追加。日付のタブ（先頭に「すべて」）                                                            |
| `apps/web/src/components/list/ListSearch.tsx`              | 追加。検索欄                                                                                    |
| `apps/web/src/components/list/ListSort.tsx`                | 追加。並び替えの選択                                                                            |
| `apps/web/src/components/list/filter-list.ts`              | 追加。開催日・タグ・検索の文字での絞り込みと、並び替え                                          |
| `apps/web/src/components/list/card-color.ts`               | 追加。カードの色。模擬店の `shop-colors.ts` と出演者の `artist-color.ts` をまとめたもの         |
| `apps/web/src/components/article/blocks/ShopList.tsx`      | 共通の部品を使う形に書き換え（一覧の中で定義していた日付タブ・タグタブ・検索・並び替えを削除）  |
| `apps/web/src/components/article/blocks/ArtistList.tsx`    | 同上。あわせて日付タブ・並び替え・検索の作りを模擬店に揃えた                                    |
| `apps/web/src/components/article/blocks/NewsList.tsx`      | タグタブを共通の部品に差し替え                                                                  |
| `apps/web/src/components/article/blocks/BlogList.tsx`      | 同上                                                                                            |
| `apps/web/src/components/{shop,artist}/*`                  | `filter-shops.ts` / `filter-artists.ts` / `shop-colors.ts` / `artist-color.ts` を削除           |
| `apps/admin/components/editor/fields/IdListCheckboxes.tsx` | 追加。ID をカンマ区切りで持つ props をチェックボックスで選ぶ入力欄                              |
| `apps/admin/components/editor/fields/SwitchField.tsx`      | 追加。「〜を出す」のスイッチ                                                                    |
| `apps/admin/components/editor/*PropsForm.tsx`              | お知らせ・ブログ・模擬店・出演者・商品の5つのフォームを、共通の入力欄を使う形に書き換え         |
| `apps/web/e2e/article.spec.ts`                             | テストデータの `shopList` の props を今の仕様に直し、一覧が描画されることを見るようにした       |

## 実装メモ

- **絞り込みは「どの値を見るか」を呼び出し側から渡す形にした**（`filterList(items, filter, accessors)`）。
  模擬店は商品名まで、出演者は演目まで検索の対象にするので、条件そのものは共通にして値の取り出し方だけ差し替える
- **並び替えは選択肢に `compare` を持たせた**。`compare` の無い選択肢（模擬店の「おすすめ順」）は読み込んだ順のまま返す。
  選択肢の表示名も同じ定義から `ListSort` に渡すので、一覧側は選択肢の配列を1つ持てばよい
- **出演者の一覧を模擬店に揃えた**（発注者と合意）。日付タブの選択は `number | null` ではなく「すべて」を含む文字列の ID、
  並び替えの既定は先頭の選択肢、検索も共通の絞り込みを使う。表示は変わらない
- **日付タブの見た目は、高さ（`h-10`）は出演者、それ以外は模擬店に合わせた**。
  英字（`Day1`・`6/6`）は `font-en`（Inter）にした。`docs/app.md` の「英字のラベルは Inter で出す」に合わせている。
  模擬店の日付タブだけ `font-en` が付いていなかったのを、こちらに揃えた
- **カードの色は、模擬店の4色に出演者の紫を足した1つの表にした**。出演者は色をデータで持たないので、
  `cardColorFromId` で ID から決める規則をそのまま残している（データで持つのは #80）
    - 出演者の水色だけ、`sky-500` から模擬店に揃えて `sky-400` になる（一覧・サマリー・セットリストの文字と Day バッジ）
- **管理者サイトのチェックボックス群は、選んだ ID を「選べるものの並び順」にそろえて返す**。
  これまで5つのフォームに同じ処理が書かれていた
- **`parseIdListProp` は1つに統合した**。機能ごとの名前（`parseNewsListTags` など）は消したので、
  今後タグや商品を選ぶ props を足すときはこれを使う

## テスト

| テスト                                                | 検証内容                                                                       |
| ----------------------------------------------------- | ------------------------------------------------------------------------------ |
| `apps/web/src/components/list/list.test.tsx`          | 絞り込み（日付・タグ・文字、空白の扱い）・並び替え・タブ／検索／並び替えの操作 |
| `apps/admin/components/editor/fields/fields.test.tsx` | チェックボックスの並び順・付け外し・`disabled`、スイッチの切り替え             |
| `packages/schema/src/article.test.ts`                 | `parseIdListProp` に統合（機能ごとに分かれていたテストを1つにまとめた）        |
| 既存のブロック・フォームのテスト                      | 変えていない。そのまま通ることを、振る舞いを変えていない証明にした             |

```
bun run format    ✅
bun run lint      ✅
bun run typecheck ✅
bun run test      ✅
bun run build     ✅
bun run e2e       ✅（web・lp とも chromium / mobile-safari）
```

## 詰まった点

なし。

## 残課題

- [ ] 模擬店・出演者のサマリーからアクションのボタンを分け、出演者の色をデータで持つ（#80）
- [ ] スケジュール表の現在時刻の線と詳細モーダル（#81）
- [ ] 模擬店・出演者の「保存」（ブックマーク）（#82）
