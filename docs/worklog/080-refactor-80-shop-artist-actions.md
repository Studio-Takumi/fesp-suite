---
title: 模擬店・出演者のアクションを別ブロックにする
issue: 80
branch: 'refactor/#80-shop-artist-actions'
date: 2026-09-22
---

# 080 refactor: #80 模擬店・出演者のアクションを別ブロックにする

## やったこと

模擬店・出演者のサマリー（`shopSummary` / `artistSummary`）に埋まっていた遷移のボタンを、
props を持たない独自コンポーネント `shopActions` / `artistActions` として切り出した。
デザインではサマリーとボタンの間に紹介文やセットリストが入るので、記事の好きな位置に置けるようにした。

## 変更したファイル

| ファイル                                                     | 変更内容                                                             |
| ------------------------------------------------------------ | -------------------------------------------------------------------- |
| `packages/schema/src/article.ts`                             | `shopActions` / `artistActions` を props なしのブロックとして追加    |
| `apps/web/src/components/article/blocks/ShopActions.tsx`     | 追加。「マップで見る」ボタン                                         |
| `apps/web/src/components/article/blocks/ArtistActions.tsx`   | 追加。「スケジュールで見る」「会場をマップで見る」ボタン             |
| `apps/web/src/components/article/blocks/ShopSummary.tsx`     | `ActionLink` を外し、基本情報だけにした                              |
| `apps/web/src/components/article/blocks/ArtistSummary.tsx`   | 同上。ボタン用に分けていた外側の `div` も畳んだ                      |
| `apps/web/src/components/article/block-registry.ts`          | 2ブロックを登録                                                      |
| `apps/web/src/lib/mock/preview-articles.ts`                  | 模擬店・出演者のプレビュー記事の末尾に2ブロックを追加                |
| `apps/admin/components/editor/blocks/ShopActionsBlock.tsx`   | 追加。エディタ上のカード                                             |
| `apps/admin/components/editor/blocks/ArtistActionsBlock.tsx` | 追加。同上                                                           |
| `apps/admin/components/editor/ArticleEditor.tsx`             | ブロックの登録とスラッシュメニューへの追加。挿入箇所に型注釈（下記） |
| `apps/admin/components/editor/ComponentPropsPanel.tsx`       | サイドパネルの名前（props が無いのでフォームは持たない）             |
| `docs/app.md`                                                | 模擬店個別・出演者個別のブロックの並びを更新                         |
| `docs/admin.md`                                              | スラッシュメニューの一覧・props の表・カードの中身の文言を更新       |

## 実装メモ

- **`artistSummary` は外側の `div` を1つ畳んだ**（理由: ボタンを外すと、サマリー本体を囲っていた
  `flex flex-col gap-3` と、その外側の `gap-6` の2重の入れ子が意味を失うため）。
  見た目の間隔は `gap-3` に揃えた

- **`shopSummary` / `artistSummary` の JSDoc に「ボタンは `shopActions` / `artistActions` の担当」と書いた。**
  サマリーを読んだときにボタンがどこへ行ったのか追えるようにするため

- **`cardColorFromId` はそのまま残した。** 出演者の色をデータで持つのは #60 の範囲で、
  この Issue では触らないと決まっている

- **ブロックの種類が増えたことで、スラッシュメニューの挿入箇所で型エラーが出た**（詰まった点を参照）。
  `insertOrUpdateBlockForSlashMenu(editor, { type })` の1か所にだけ
  `as PartialBlock<typeof articleSchema.blockSchema>` を付け、理由をコメントで残した

## テスト

| テスト                                                     | 検証内容                                                                 |
| ---------------------------------------------------------- | ------------------------------------------------------------------------ |
| `packages/schema/src/article.test.ts`                      | 2ブロックが props なし・中身なしのときだけ通ること                       |
| `apps/web/src/components/article/ArticleRenderer.test.tsx` | 2ブロックがリンクを出すこと、サマリーからボタンが消えたこと              |
| `apps/admin/components/editor/ArticleEditor.test.tsx`      | エディタのブロック一覧と、スラッシュメニューのグループごとの並び（更新） |

```
bun run format   ✅
bun run lint     ✅
bun run typecheck ✅
bun run test     ✅
bun run build    ✅
```

`bun run e2e` は画面の導線（ルーティング）を変えていないので流していない。

## 詰まった点

- **ブロックを2つ足したら、無関係に見える箇所で TypeScript が落ちた。**
  `insertOrUpdateBlockForSlashMenu(editor, { type })` の `type` は独自コンポーネント全部の共用体で、
  渡し先の `PartialBlock` もブロックごとの共用体。TypeScript は
  `{ type: A | B }` を `X_A | X_B` へ割り当てるとき、判別プロパティの組み合わせを展開して確かめるが、
  この展開には上限があり、ブロックが増えてそれを超えると「`"map"` は `"relatedPosts"` に割り当てられない」
  という形で落ちる。実体は必ずどれかのブロックなので、その1か所だけ型を指定して回避した。
  **今後ブロックを足しても再発しない**（上限を超えた状態は変わらないが、型注釈で展開させていないため）

## 残課題

- [ ] 出演者の色をデータで持ち、`cardColorFromId` をやめる（#60）
- [ ] テンプレートでのブロックの並びの固定（#64）
- [ ] 紹介文（`description`）・注意事項を読む独自コンポーネントを足すか（#59 / #60 で判断する）
