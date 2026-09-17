---
title: マップ（Map）の独自コンポーネントを作る
issue: 18
branch: 'feat/#18-map-component-block'
date: 2026-09-18
---

# 018 feat: #18 マップ（Map）の独自コンポーネントを作る

## やったこと

会場のマップを1ページ分出す独自コンポーネント `map`（props なし）を、schema・ウェブアプリのレジストリ・管理者サイトのブロック定義の3点セットで追加した。
ウェブアプリでは、白一色の地図の面に検索バー・フロア切替・現在地ボタン・引き上げ式ボトムシート（カテゴリのタブ＋場所の一覧を仮データで）を重ねて出す。
管理者サイトでは、props を持たないコンポーネントを選んだときにサイドパネルへ「設定する項目はありません」と出す仕組みを足した。

## 変更したファイル

| ファイル                                                                               | 変更内容                                                                                          |
| -------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------- |
| `docs/app.md`                                                                          | 本文の描画の表に `map`、「マップ」の節を追記（別コミット）                                        |
| `docs/admin.md`                                                                        | コンポーネントの表に `map`、props なしのパネルの文言、「マップ」の節を追記（別コミット）          |
| `packages/schema/src/article.ts`                                                       | `mapPropsSchema`（`z.object({}).strict()`）を追加し、記事ドキュメントのブロックに `map` を足す    |
| `apps/web/src/lib/mock/map.ts`                                                         | 追加。フロア（`3F` / `2F` / `1F`）と場所の一覧の仮データ                                          |
| `apps/web/src/lib/queries.ts`                                                          | `mapQuery` を追加。`queryFn` で仮データを `Promise.resolve` で返す                                |
| `apps/web/src/components/article/blocks/Map.tsx`                                       | 追加。マップ本体（画面の高さいっぱいの枠・検索バー・現在地ボタン、部品の組み立て）                |
| `apps/web/src/components/article/blocks/map/MapBottomSheet.tsx`                        | 追加。2段で止まる引き上げ式ボトムシート（pointer events のドラッグ・ハンドルのタップ）            |
| `apps/web/src/components/article/blocks/map/MapCategoryTabs.tsx`                       | 追加。カテゴリのタブ（ホーム・食べ物・体験・ステージ）                                            |
| `apps/web/src/components/article/blocks/map/MapFloorSwitch.tsx`                        | 追加。フロア切替                                                                                  |
| `apps/web/src/components/article/blocks/map/MapPlaceList.tsx`                          | 追加。場所の一覧と0件の文言                                                                       |
| `apps/web/src/components/article/blocks/map/filter-map-places.ts`                      | 追加。検索の文字とカテゴリで場所を絞り込む                                                        |
| `apps/web/src/components/article/block-registry.ts`                                    | `map` を登録                                                                                      |
| `apps/admin/components/editor/blocks/MapBlock.tsx`                                     | 追加。カードに「会場のマップを出します」とだけ出すブロック                                        |
| `apps/admin/components/editor/ComponentPropsPanel.tsx`                                 | `ComponentBlock` を union にし、`renderForm` を省いたコンポーネントは「設定する項目はありません」 |
| `apps/admin/components/editor/ArticleEditor.tsx`                                       | スキーマに `map`、スラッシュメニューの「コンポーネント」グループに「マップ」を追加                |
| `packages/schema/**/*.test.ts` / `apps/web/**/*.test.tsx` / `apps/admin/**/*.test.tsx` | テストを追加                                                                                      |

## 実装メモ

- **地図の面は白一色、ピンは置かない（Issue の決定どおり）。** 依存パッケージは足していない
- **フロアは仮データ側に持たせた。** フロアも会場のデータなので、あとで API に差し替えるときに場所の一覧と一緒に変わる。開いたときは一番下の階（配列の最後）を選ぶ。フロアを選んでも一覧は変えない
- **カテゴリは「選んでいない」状態から始め、選んでいるタブをもう一度押すと外す。** デザインは「食べ物」を選んだ状態の絵だが、全部の場所を見る手段が要るため。仕様書にも書いた
- **検索は名前・団体名・会場の部分一致（前後の空白を除き、英字の大文字・小文字を区別しない）にした**
- **ボトムシートは `transform: translateY` で動かす。** たたんだ位置は `calc(100% - 7rem)`（ハンドル `h-6` + タブ `h-22`）で、描画前に大きさを測らなくても決まる。ドラッグ中だけ、押したときに測ったシートとたたんだ部分の高さから px で動かし、動く範囲を2段の間に収める。離したときに中間より上なら開き、下ならたたむ
- **ドラッグはハンドル（全幅・高さ `h-6`）だけで受ける。** タブの上でドラッグを取るとボタンの click と取り合うため。`touch-none` でスクロールと取り合わないようにし、`setPointerCapture` で指が外れても追う
- **ハンドルは `button` にし、開閉は `onClick` で行う。** キーボードでも開閉できる。ドラッグで離した直後に来る click は無視する（4px 以下の移動はタップ扱い）
- **開いた状態の高さは画面の半分（`h-1/2`）にした。** デザインのシートの高さ（340 / 703）に合わせた。一覧はシートの中だけスクロールする
- **サムネと Day バッジの色は、場所の並び順で rose / amber / emerald / violet / sky を順に使う。** デザインでは同じカテゴリ（食べ物）でも色が違い、カテゴリで決まっていないため
- **0件のときは一覧の位置に「該当する場所がありません」とだけ出す。** #13 の共通の空状態は並行中で使えないため（指示どおり）
- **一覧の読み込み中・エラーは `QueryBoundary` で一覧の位置に出す。** 検索バー・現在地ボタン・ボトムシートの枠は読み込みを待たずに出す
- **シートの上端の影はデフォルトスケールの `shadow-lg` と `border-t` にした。** デザインは上向きの影（y: -2, blur 16）だが、任意値を避けるため
- **管理者サイトのパネルは、`componentPanels` の `renderForm` を省けば「設定する項目はありません」と出る形にした。** これから足す props なしのコンポーネントも、対応表に名前だけ書けばよい
- **`ArticleEditor.tsx` のカーソル位置のブロックは `ComponentBlock` にキャストした。** `ComponentBlock` が union になり、取り出した `type` と `props` の組み合わせを TypeScript が追えなくなったため

## テスト

| テスト                                                      | 検証内容                                                                                                                                       |
| ----------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| `packages/schema/src/article.test.ts`                       | マップの受理（JSON 経由で `content` が消えていてもよい）、props が無い・知らない props・中身があるときの拒否、`mapPropsSchema`                 |
| `apps/web/src/components/article/blocks/Map.test.tsx`       | 各部品の表示、検索での絞り込み、カテゴリの絞り込みと選択を外す、0件の文言、フロア切替の選択状態、ハンドルのタップで開閉、ドラッグで2段に止まる |
| `apps/web/src/components/article/ArticleRenderer.test.tsx`  | `map` をマップ（画面の高さいっぱい）として描画し、後ろのブロックの描画を続ける                                                                 |
| `apps/admin/components/editor/ArticleEditor.test.tsx`       | 許可するブロックに `map` が入る、カードの一文、カーソルがあればパネルに「設定する項目はありません」、別のブロックならパネルを出さない          |
| `apps/admin/components/editor/ComponentPropsPanel.test.tsx` | `map` を独自コンポーネントと判定する、props なしのパネルの表示                                                                                 |

```
bun run format    ✅
bun run lint      ✅
bun run typecheck ✅
bun run test      ✅
bun run build     ✅
```

### 動作確認（ローカル）

Playwright（Chromium）で、ログイン済みのセッションを入れ、API の返事を差し替えて確認した（fesp-dev にデータを作らないため）。

- ウェブアプリ（iPhone 14 のサイズ・タッチあり）で `map` だけの記事を開くと、検索バー・フロア切替（`1F` を選択中）・現在地ボタン・たたんだボトムシート（ハンドルとカテゴリのタブ）が出る
- ハンドルをマウスで少し引き上げると指に合わせて動き、さらに上で離すと開いた状態に止まる。少し下げて離すと開いたまま、タップでたたむ
- CDP のタッチイベント（`touchStart` → `touchMove` → `touchEnd`）でハンドルを引き上げても開く
- 「食べ物」で食べ物だけになり、`3F` を押すと `3F` が水色になる。検索に合わない文字を入れると「該当する場所がありません」が出る
- 管理者サイトで `/map` → Enter で「マップ」のカードが入り、サイドパネルに「マップ」「設定する項目はありません」が出る。保存すると `PUT /api/articles/:id` の本文に `{ type: 'map', props: {} }` が入る
- どちらもコンソールエラーが出ない

## 詰まった点

- **`ComponentBlock` を union にしたら、パネルの `renderForm` の呼び出しと `ArticleEditor.tsx` のセレクタが型エラーになった。** 対応表は `type` ごとに引数を絞っているので、呼ぶ側で全コンポーネントの union を受ける関数として広げて呼ぶようにした

## 残課題

- [ ] 地図の面（校舎の図形・画像マップ）とピン、`map_pins` テーブル・API（#61）
- [ ] 記事ページの中では、共通レイアウトのヘッダー（`sticky`）と `main` の余白の中にマップが入る。画面の高さいっぱい（`100dvh`）にしているので、ヘッダーの分だけページがスクロールし、左右に余白も付く。マップページ（#61）のレイアウトで決める
