---
title: 模擬店（Shop）の独自コンポーネントを作る
issue: 16
branch: 'feat/#16-shop-component-blocks'
date: 2026-09-18
---

# 016 feat: #16 模擬店（Shop）の独自コンポーネントを作る

## やったこと

模擬店一覧 `shopList`・模擬店のサマリー `shopSummary`・商品一覧 `productList` の3つの独自コンポーネントを、schema・ウェブアプリのレジストリ・管理者サイトのブロック定義の3点セットで追加した。
表示するデータは API ができるまで仮データを `lib/queries.ts` の queryOptions から返す。個別ページの画像は #13 の `coverImage`、説明は段落、注意事項は #66 の `callout` をそのまま使い、新しいブロックは作っていない。

## 変更したファイル

| ファイル                                                                                                  | 変更内容                                                                                                          |
| --------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------- |
| `docs/app.md`                                                                                             | 本文の描画の表に3ブロックと、ブロックごとの節を追記（別コミット）                                                 |
| `docs/admin.md`                                                                                           | コンポーネントの表に3ブロックと、ブロックごとの節を追記（別コミット）                                             |
| `packages/schema/src/article.ts`                                                                          | `shopListPropsSchema` / `productListPropsSchema` と ID の配列にする関数を追加し、記事ドキュメントのブロックに足す |
| `apps/web/src/components/article/blocks/ShopList.tsx`                                                     | 追加。日付タブ・検索・並び替え・タグタブ・カードの一覧。0件なら空状態                                             |
| `apps/web/src/components/article/blocks/ShopSummary.tsx`                                                  | 追加。Day・団体・店名・時間・場所と「マップで見る」                                                               |
| `apps/web/src/components/article/blocks/ProductList.tsx`                                                  | 追加。商品を2列で出す。表示する商品が空なら全件                                                                   |
| `apps/web/src/components/shop/ShopCard.tsx`                                                               | 追加。一覧の1枚（デザインの ShopCard）                                                                            |
| `apps/web/src/components/shop/filter-shops.ts`                                                            | 追加。開催日・タグ・検索の絞り込みと並び替え                                                                      |
| `apps/web/src/components/shop/shop-colors.ts`                                                             | 追加。模擬店の色ごとのクラス                                                                                      |
| `apps/web/src/components/article/block-registry.ts`                                                       | 3ブロックを登録                                                                                                   |
| `apps/web/src/lib/mock/shop.ts` / `apps/web/src/lib/queries.ts`                                           | 追加。模擬店・タグ・開催日・表示中の模擬店の仮データと queryOptions                                               |
| `apps/admin/components/editor/blocks/ShopListBlock.tsx` / `ShopSummaryBlock.tsx` / `ProductListBlock.tsx` | 追加。3ブロックの定義。カードには設定の要約・説明だけを出す                                                       |
| `apps/admin/components/editor/ShopListPropsForm.tsx` / `ProductListPropsForm.tsx`                         | 追加。props のフォーム（React Hook Form + zod）                                                                   |
| `apps/admin/components/editor/ComponentPropsPanel.tsx`                                                    | 対応表に3ブロックを足す（`shopSummary` は名前だけ）                                                               |
| `apps/admin/components/editor/ArticleEditor.tsx`                                                          | スキーマとスラッシュメニューの「コンポーネント」に3項目を足す                                                     |
| `apps/admin/lib/mock/shop.ts` / `apps/admin/lib/queries.ts`                                               | 追加。タグ・商品の仮データと queryOptions                                                                         |
| `**/*.test.ts(x)`                                                                                         | テストを追加                                                                                                      |

## 実装メモ

- **タブに出すタグ（`tags`）・表示する商品（`products`）は、ID をカンマ区切りで並べた文字列にした。** #13 の `newsList` と同じ形（BlockNote の props は配列を持てない）。空の ID（`a,,b` など）は schema で拒否する。並びは選んだ順ではなくタグ・商品の一覧の順
- **カンマ区切りを配列にする関数は `parseShopListTags` / `parseProductListIds` として足した。** 中身は共通の `parseIdList` に寄せたが、#13 の `parseNewsListTags` は他の並列ブランチと衝突しやすいのでそのままにしている
- **並び替えの項目は「おすすめ順」「名前順」の2つにした。** デザインに出ているのは初期値の「おすすめ順」だけで、ほかの項目が描かれていないため。おすすめ順は読み込んだ順、名前順は `localeCompare(..., 'ja')`
- **検索は店名・団体名・場所・商品名に当てる**（デザインのプレースホルダが「店名・商品で検索」のため）。前後の空白を除き、英字の大文字・小文字は区別しない（`map` の `filterMapPlaces` と同じ）
- **日付タブは先頭に「すべて」を置いた**（デザインの `web / Shop一覧 / iPhone` どおり。スケジュール表の日付タブと違い、模擬店は全日まとめて見られるほうが自然なため）
- **絞り込みで0件になったときも、日付タブ・検索・並び替え・タグタブは出したままにする。** 出さないと絞り込みを戻せなくなるため。空状態の文言は「模擬店が見つかりません」「条件に合う模擬店がありません。絞り込みを変えてお試しください。」
- **模擬店の色（`color`）は仮データが持つ。** デザインのカードは店ごとに色が変わり、タグ（食べ物・体験…）とは対応していないため。クラスは `shop-colors.ts` に書き出す（Tailwind がクラス名を見つけられるよう組み立てない）
- **カードの中の商品は先頭から3件まで。** デザインのサムネが3つのため。サムネは `ul` にせず `div` で並べた（カード自体が `li` で、商品まで `listitem` になると一覧の件数が数えにくいため）
- **`shopSummary` は、ヒーローの色の枠を出さずに基本情報から始める。** 個別ページのヒーローの画像は #13 の `coverImage` が出す担当で、ヒーローの中の店名は基本情報の店名と同じもののため
- **「マップで見る」の右にある「保存」（ブックマーク）のボタンは出していない。** 保存の置き場（ログイン中の来場者のデータ）が決まっていないため。Issue の props にも入っていない
- **商品の画像（`image_url`）は仮データでは `null` にして、色付きの角丸に商品名の1文字目を出す。** デザインの写真は Unsplash のもので、仮データに外部の URL を持たせたくないため。URL があれば画像を出す実装は入れてある
- **カードのリンク先は `/shops/:id`、「マップで見る」は `/map` にした。** どちらもまだルートが無いので `<a href>`（#13 と同じ。ページができたら `Link` にする）
- **`productList` は表示中の模擬店（`currentShopQuery`）の商品を読む。** 商品だけの queryOptions は作らず、模擬店1件に商品をぶら下げた（色も同じ1件から取るため）
- 管理者サイトのカードは設定の要約だけを出し、模擬店・商品のプレビューはしない（#13 と同じ）。タグ・商品の名前を出すため、模擬店一覧と商品一覧のカードだけ仮データを読む

## テスト

| テスト                                                       | 検証内容                                                                                                                                                                                           |
| ------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `packages/schema/src/article.test.ts`                        | 3ブロックの受理（挿入直後・JSON 経由で content キーが消えた形）、タグ・商品の不正、props の欠け・型違い・余計な props・中身の拒否、エラーメッセージ、ID の配列にする関数                           |
| `apps/web/src/components/article/ArticleRenderer.test.tsx`   | カードの中身（Day・団体・場所・商品3件まで・リンク）、日付タブ・タグタブの絞り込み、検索（商品名も当たる）、名前順の並び替え、出さない設定、0件の空状態、サマリー、商品一覧（選んだ商品だけ・0件） |
| `apps/admin/components/editor/ArticleEditor.test.tsx`        | 許可するブロックに3ブロックが入る、カードの要約・説明、サイドパネルでの切り替え・商品の選択が props に入る                                                                                         |
| `apps/admin/components/editor/ComponentPropsPanel.test.tsx`  | 独自コンポーネントの判定、模擬店一覧のフォーム（初期値・タグの選択順・スイッチ・無効化）、商品一覧のフォーム、`shopSummary` の「設定する項目はありません」                                         |
| `apps/admin/components/editor/ShopListPropsForm.test.tsx`    | スイッチ・タグの初期値、切り替えたときの `onValidChange`、タグタブがオフの間はタグを選べない                                                                                                       |
| `apps/admin/components/editor/ProductListPropsForm.test.tsx` | 商品の初期値、選ぶ・外したときに商品の一覧の順で `onValidChange` を呼ぶ                                                                                                                            |

```
bun run format    ✅
bun run lint      ✅
bun run typecheck ✅
bun run test      ✅
bun run build     ✅
```

画面の導線は触っていないので e2e は回していない。

### 動作確認（ローカル）

Playwright（headless Chromium）で、ログイン済みのセッションを入れ、記事 API の返事を差し替えて確認した（fesp-dev にデータを作らないため）。web は `--port 5187`、admin は `--port 3017` で立てて、確認後に止めた。

- ウェブアプリ（iPhone の幅 390px）
    - 模擬店一覧: 日付タブ（すべて・Day1 6/6(土)・Day2 6/7(日)）・検索・並び替え・タグタブ（すべて・食べ物・体験・展示・物販）と6件のカードが出る
    - Day2 で3件、さらに「体験」で1件に絞り込まれる。検索に「ないお店」と入れると空状態が出て、タブ・検索は残る
    - 模擬店個別の形（`coverImage` → `shopSummary` → 段落 → `productList` → `callout`）: 店名・Day1・2年1組・`9:10 - 14:30`・特別教室A・「マップで見る」（`/map`）が出て、メニューに商品4件が2列で並ぶ
    - 横スクロールが出ない。コンソールエラーが出ない
- 管理者サイト
    - 3つのカードに要約・説明が出る。模擬店一覧を選ぶとパネルにスイッチ4つ・タグのチェックボックス・「カードに商品を出す」が出る
    - 「カードに商品を出す」を切ると要約が「カードの商品: なし」に変わる。商品一覧で商品を選ぶと要約が商品の一覧の順に並ぶ
    - 模擬店のサマリーを選ぶとパネルに「設定する項目はありません」と出る
    - `/` のメニューを `mogiten` で絞ると「模擬店一覧」「模擬店のサマリー」が出て、入れるとパネルが開く
    - 保存すると `PUT /api/articles/:id` の本文に `shopList` の props が入る
    - コンソールエラーが出ない

## 詰まった点

- **`apps/web/.env` / `apps/admin/.env` が無く、`bun run build` が env の検証で落ちた。** worktree には gitignore されたファイルが無いため。本体のリポジトリからコピーして通した（コミットはしていない）

## 残課題

- [ ] 模擬店のテーブル・API・管理画面の模擬店一覧/編集・模擬店一覧/個別ページ、仮データの差し替え（#59）
- [ ] 「マップで見る」からピンの位置を指定して開く（#61）
- [ ] テンプレートによるロック（#64）
- [ ] iPad の2ペイン（#67）
- [ ] `apps/web/e2e/article.spec.ts` のフィクスチャにある `shopList` の props（`{ day: 1 }`）が仕様前のもので、いまは描画されずに落ちる。画面を作る回（#59）に直す
