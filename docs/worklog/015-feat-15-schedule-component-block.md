---
title: スケジュール（Schedule）の独自コンポーネントを作る
issue: 15
branch: 'feat/#15-schedule-component-block'
date: 2026-09-18
---

# 015 feat: #15 スケジュール（Schedule）の独自コンポーネントを作る

## やったこと

スケジュール表 `scheduleTable`（`ui-design.pen` の `web / Schedule / iPhone`。日付タブ・会場ヘッダー・時間のグリッド）を、schema・ウェブアプリのレジストリ・管理者サイトのブロック定義の3点セットで追加した。
データは API を作らず、ウェブアプリの `lib/mock/schedule.ts` の仮データを `scheduleQuery` から返す。
その日の項目が0件のときに出す共通の空状態 `EmptyState`（`web / 状態: 空 / iPhone`）もウェブアプリに作った。

## 変更したファイル

| ファイル                                                     | 変更内容                                                                                             |
| ------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------- |
| `docs/app.md`                                                | 本文の描画に `scheduleTable` と「スケジュール表」の節を追記（別コミット）                            |
| `docs/admin.md`                                              | コンポーネントの表に `scheduleTable` と「スケジュール表」の節を追記（別コミット）                    |
| `packages/schema/src/article.ts`                             | `scheduleTablePropsSchema`（`showDateTabs: boolean`）を追加し、記事ドキュメントのブロックに足す      |
| `packages/ui/src/lib/date-formatter.ts`                      | ゼロ埋めしない月・日・時のトークン `M` / `D` / `H` を追加                                            |
| `apps/web/src/lib/mock/schedule.ts`                          | 追加。スケジュールの型（日付 → 会場 → 項目）と仮データ（デザインの2日分）                            |
| `apps/web/src/lib/queries.ts`                                | `scheduleQuery` を追加。queryFn は仮データを `Promise.resolve` で返す                                |
| `apps/web/src/components/EmptyState.tsx`                     | 追加。空状態（アイコン・見出し・説明・「再読み込み」ボタン）                                         |
| `apps/web/src/components/article/blocks/ScheduleTable.tsx`   | 追加。日付タブ・会場ヘッダー・時間のグリッド                                                         |
| `apps/web/src/components/article/block-registry.ts`          | `scheduleTable` を登録                                                                               |
| `apps/admin/components/editor/blocks/ScheduleTableBlock.tsx` | 追加。カードに設定の要約（「日付タブ: あり / なし」）だけを出す                                      |
| `apps/admin/components/editor/ScheduleTablePropsForm.tsx`    | 追加。「日付タブを出す」のスイッチのフォーム（React Hook Form + zod）                                |
| `apps/admin/components/editor/ComponentPropsPanel.tsx`       | 対応表に `scheduleTable` を足し、`ComponentBlock` を union にする                                    |
| `apps/admin/components/editor/ArticleEditor.tsx`             | スキーマに `scheduleTable`、スラッシュメニューの「コンポーネント」グループに「スケジュール表」を追加 |
| `apps/web/**/*.test.tsx` / `apps/admin/**/*.test.tsx` など   | テストを追加                                                                                         |

## 実装メモ

- **props は `showDateTabs` の1つだけ。** 挿入した直後は `true`（デザインどおりタブを出す）。`false` のときは1日目を出す
- **仮データは項目の開始・終了を日本時間の日時（`+09:00` 付きの ISO 文字列）で持つ。** 表示は `dateFormatter` で出し、グリッドの位置も `dateFormatter` で日本時間の時・分を取って計算する。本物の API の形は #58 で決めるので、差し替えるときに合わせて直す
- **`dateFormatter` に `M` / `D` / `H` を足した。** デザインが `6/6`・`8:20-9:20` とゼロ埋めしない表記のため。`docs/conventions.md` の「トークンを足したいときは `date-formatter.ts` を直す」に従った。`MM` / `DD` / `HH` を先に照合するので既存の書式は変わらない
- **グリッドは1時間 80px（`h-20` 相当）で、項目の `top` / `height` は `style` で渡す。** 時刻から計算する値なので Tailwind のクラスにできない。時刻の範囲は、その日の項目の最も早い開始（正時に切り捨て）から最も遅い終了（正時に切り上げ）まで
- **会場の列は `ul`（`aria-label` に会場名）、項目は `li` にした。** 項目は押しても何も起きない（リンク・ボタンにしない）。枠に収まらない文字は `overflow-hidden` で隠す
- **デザインの項目の時間の文字は 10px だが、デフォルトスケールの最小の `text-xs`（12px）にした**（`docs/conventions.md`）
- **デザインにある「現在時刻の線」（赤い線と時刻）は作っていない。** Issue の範囲（日付タブ・会場ヘッダー・時間のグリッド）に含まれておらず、仮データの日付が今日ではないため。要るなら別 Issue にする（下の「確認してほしいこと」）
- **空状態は「選んだ日の項目が0件」で出す（日付が1つも無いときも）。** 日付タブは出したままにして、ほかの日に切り替えられるようにした。「再読み込み」は `refetch` する
- **`EmptyState` は #13 と重複して作っている。** 並行作業のため、同じパス・同じ props（`{ title, description, onRetry }`）で作った。先にマージされた方に合わせて、あとで重複を解消する。`@fesp/ui` にも同名の `EmptyState`（エラー表示などで使っている）があるが、見た目と props が違うので触っていない
- **`ComponentPropsPanel` の `renderForm` を呼ぶところだけ `as never` で型を外した。** `type` と props の組み合わせは対応表の型で保証しているが、`ComponentBlock` が union になり TypeScript が対応づけて絞り込めないため。同じ理由で、`ArticleEditor.tsx` のカーソル位置のブロックも `as ComponentBlock` にしている
- 読み込み中・失敗の表示は、記事ページと同じ `QueryBoundary` を使った（取得の単位はコンポーネント）

## テスト

| テスト                                                          | 検証内容                                                                                                                                                          |
| --------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `packages/schema/src/article.test.ts`                           | スケジュール表の受理（`true` / `false`・JSON 経由）、props の欠け・型違い・余計な props・中身があるときの拒否、`parseArticleDocument` で壊れたものだけ除く        |
| `packages/ui/src/lib/date-formatter.test.ts`                    | `M` / `D` / `H` をゼロ埋めせずに出す                                                                                                                              |
| `apps/web/src/components/article/blocks/ScheduleTable.test.tsx` | 日付タブの表示と初期選択、タブの切り替え、タブを出さないときは1日目、会場ヘッダーと時刻の範囲、項目の列・位置・高さ、0件の空状態と再読み込み、日付0件、読み込み中 |
| `apps/web/src/components/EmptyState.test.tsx`                   | 見出し・説明の表示、「再読み込み」で `onRetry` を呼ぶ                                                                                                             |
| `apps/web/src/components/article/ArticleRenderer.test.tsx`      | `scheduleTable` をレジストリから描画する                                                                                                                          |
| `apps/admin/components/editor/ArticleEditor.test.tsx`           | 許可するブロックに `scheduleTable` が入る、カードの要約（あり / なし）、パネルのスイッチで props が変わり `onChange` に渡る                                       |
| `apps/admin/components/editor/ComponentPropsPanel.test.tsx`     | 独自コンポーネントの判定、コンポーネント名とスイッチの初期値、切り替えるたびに props を渡す                                                                       |
| `apps/admin/components/editor/ScheduleTablePropsForm.test.tsx`  | スイッチの初期値、切り替えた値で `onValidChange` を呼ぶ                                                                                                           |

```
bun run format    ✅
bun run lint      ✅
bun run typecheck ✅
bun run test      ✅
bun run build     ✅
```

e2e は追加・変更していない（画面の導線は変えていない）。

### 動作確認（ローカル）

Playwright（headless Chromium）で、ログイン済みのセッションを入れ、API の返事を差し替えて確認した（fesp-dev にテスト用のデータを作らないため）。web は `--port 5182`、admin は `--port 3012` で起動し、確認後に止めた。

- ウェブアプリ（iPhone 14 の表示）で、`pageHeader` + `scheduleTable` の記事を開くと、日付タブ（Day1 6/6(土) を選択中）・会場ヘッダー（体育館 / 中庭 / 模擬店）・8:00〜17:00 のグリッドに項目がデザインどおりの位置で出る
- 「Day2」を押すと 6/7 のタイムテーブルに切り替わる。項目を押しても URL は変わらない
- `showDateTabs: false` の記事では日付タブが出ず、1日目が出る
- 横スクロールは出ない（`scrollWidth` 390）。コンソールエラーは出ない
- 管理者サイトで、スケジュール表のカードに「日付タブ: あり」が出る。カードを押すとパネル「スケジュール表」が開き、スイッチを切ると「日付タブ: なし」になる
- `/スケジュール` で「コンポーネント」グループに「スケジュール表」が出て、選ぶとカード（日付タブ: あり）が入りパネルが開く
- 保存すると `PUT /api/articles/:id` の本文に `scheduleTable`（`{ showDateTabs }`）が入る
- 空状態はブラウザでは確認していない（仮データが0件にならないため）。コンポーネントのテストで確認している

## 詰まった点

- **管理者サイトでスイッチを切り替えた直後のスクリーンショットで、スイッチがオンのままに見えた。** `aria-checked` は `false` になっており、スイッチの `transition` の途中を撮っていただけだった

## 確認してほしいこと

- **デザインの「現在時刻の線」を作っていない。** 要るなら、日付の扱い（#58）と合わせて別 Issue にしたい
- **同じ会場で時間が重なる項目は、横に並べず重ねて出す。** デザインに重なる例が無いため。運用で重なりうるなら方針を決めたい
- **`dateFormatter` にトークン `M` / `D` / `H` を足した**（`packages/ui`）。ほかの Issue でも使えるが、共通パッケージの変更なので見てほしい
- **`EmptyState` は #13 と重複している。** 先にマージされた方を正にして、あとのほうで重複を解消する

## 残課題

- [ ] 本物のスケジュールの API に差し替える（#58）
- [ ] 項目を押したときの詳細モーダル（`web / Schedule モーダル / iPhone`）
- [ ] iPad のレイアウト（#67）
- [ ] テンプレートによるロック（#64）
