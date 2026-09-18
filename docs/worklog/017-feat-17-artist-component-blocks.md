---
title: 出演者（Artist）の独自コンポーネントを作る
issue: 17
branch: 'feat/#17-artist-component-blocks'
date: 2026-09-18
---

# 017 feat: #17 出演者（Artist）の独自コンポーネントを作る

## やったこと

出演者一覧 `artistList`・出演者のサマリー `artistSummary`・セットリスト `setList` の3つの独自コンポーネントを、schema・ウェブアプリのレジストリ・管理者サイトのブロック定義の3点セットで追加した。
一覧の日付タブ・検索・並び替え・タグタブは props で出し分ける。表示するデータは API ができるまで仮データを `lib/queries.ts` の queryOptions から返す。

## 変更したファイル

| ファイル                                                          | 変更内容                                                                                   |
| ----------------------------------------------------------------- | ------------------------------------------------------------------------------------------ |
| `docs/app.md`                                                     | 本文の描画の表に3ブロック、ブロックごとの節を追記（別コミット）                            |
| `docs/admin.md`                                                   | コンポーネントの表に3ブロック、ブロックごとの節を追記（別コミット）                        |
| `packages/schema/src/article.ts`                                  | `artistListPropsSchema`・`parseArtistListTags` を追加し、記事ドキュメントに3ブロックを足す |
| `apps/web/src/components/article/blocks/ArtistList.tsx`           | 追加。日付タブ・検索・並び替え・タグタブ・カードの一覧・0件なら空状態                      |
| `apps/web/src/components/article/blocks/ArtistSummary.tsx`        | 追加。Day・団体・演目・出演日時・会場・人数と、スケジュール・マップへのボタン              |
| `apps/web/src/components/article/blocks/SetList.tsx`              | 追加。曲名と原曲のアーティスト。曲が無ければ出さない                                       |
| `apps/web/src/components/artist/ArtistCard.tsx`                   | 追加。出演者一覧の1枚（デザインの ArtistCard）                                             |
| `apps/web/src/components/artist/artist-color.ts`                  | 追加。出演者ごとの色（紫・緑・水色）を ID から決める                                       |
| `apps/web/src/components/artist/filter-artists.ts`                | 追加。日付・検索の文字・タグでの絞り込みと並び替え                                         |
| `apps/web/src/components/article/block-registry.ts`               | 3ブロックを登録                                                                            |
| `apps/web/src/lib/mock/artist.ts` / `apps/web/src/lib/queries.ts` | 追加。出演者・タグ・表示中の出演者・セットリストの仮データと queryOptions                  |
| `apps/admin/components/editor/blocks/*Block.tsx`                  | 追加。3ブロックの定義。カードには設定の要約・説明だけを出す                                |
| `apps/admin/components/editor/ArtistListPropsForm.tsx`            | 追加。props のフォーム（React Hook Form + zod）                                            |
| `apps/admin/components/editor/ComponentPropsPanel.tsx`            | 対応表に3ブロックを足す（サマリー・セットリストは名前だけ）                                |
| `apps/admin/components/editor/ArticleEditor.tsx`                  | スキーマとスラッシュメニューの「コンポーネント」に3項目を足す                              |
| `apps/admin/lib/mock/artist.ts` / `apps/admin/lib/queries.ts`     | 追加。タグの仮データと queryOptions（ID はウェブアプリと揃える）                           |
| `**/*.test.ts(x)`                                                 | テストを追加                                                                               |

## 実装メモ

- **`artistList` の props は5つ（`showDateTabs` / `showSearch` / `showSort` / `showTagTabs` / `tags`）にした。** タブに出すタグは `newsList` と同じく ID をカンマ区切りで並べた文字列（BlockNote の props は文字列・数値・真偽値しか持てない）。`parseArtistListTags` は `parseNewsListTags` と同じ処理だが、#16（模擬店）と並行で進めているため今は各ブロックに持たせている（共通化はあとで行う前提）
- **並び替えの選択肢は「出演順」（出演の早い順）「名前順」（`localeCompare('ja')`）の2つにした。** デザインには「出演順」しか出ていないので、もう1つは仮で決めている（要確認）
- **検索は出演者名・演目・団体名を見る。** プレースホルダは デザインどおり「出演者・演目で検索」。マップの検索（名前・団体名・会場）と同じ考え方で、カードに出している文字を対象にした
- **日付タブは仮データの `day`（1日目なら 1）から作る。** 出演者の `starts_at` から日付（`M/D`）と曜日を出し、Day の順に並べる。「すべて」を先頭に置き、開いたときは「すべて」を選ぶ（デザインどおり）
- **出演者ごとの色（紫・緑・水色）は ID から決めている（`artist-color.ts`）。** デザインでは出演者ごとに枠・三角・Day バッジ・セットリストの番号が同じ系統の色になっているが、色をデータに持たせたくないため。カード・サマリー・セットリストで同じ規則を使う
- **`artistSummary` は基本情報とボタンを続けて出している。** デザインでは基本情報とアクション（ボタン）の間に説明とセットリストが入るが、Issue の仕様どおり1ブロックなので分けられない。個別ページは「画像 → サマリー（基本情報＋ボタン）→ 説明 → セットリスト」の並びになる（要確認）
- **出演者名は `artistSummary` で `h1`、カードでは `h2` にした。** 出演者の個別ページにはページ見出し（`pageHeader`）が無く、出演者名がページのタイトルになるため
- **`setList` は曲が0件ならブロックごと出さない。** 一覧の空状態は「まだ公開されていない一覧」に出すもので、セットリストが無い出演者に空状態を出すのは意味が違うと判断した（天気のブロックと同じ扱い）
- **カード・サマリーのリンク先は `/artists/:id`・`/schedule`・`/map`。** まだルートが無いので TanStack Router の `Link` は型で通らず、`<a href>` にしている（#13 と同じ）
- **管理者サイトのカードは設定の要約・説明だけを出す。** タグの名前を出すため、出演者一覧のカードだけタグの仮データを読む
- スラッシュメニューのアイコンは 出演者一覧 `Music`・出演者のサマリー `Mic`・セットリスト `ListMusic`（lucide）

## テスト

| テスト                                                      | 検証内容                                                                                                                                                 |
| ----------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `packages/schema/src/article.test.ts`                       | 3ブロックの受理（タグ未選択・JSON 経由で content キーが消えた形）、タグ・props の欠け・型違い・余計な props・中身の拒否、`parseArtistListTags`           |
| `apps/web/src/components/article/ArticleRenderer.test.tsx`  | カードの中身とリンク、日付タブ・検索・並び替え・タグタブでの絞り込み、タグ未選択でタブを出さない、0件の空状態、サマリー、セットリスト（0件なら出さない） |
| `apps/admin/components/editor/ArticleEditor.test.tsx`       | 許可するブロックに3ブロックが入る、カードの要約・説明、スイッチでの props の反映                                                                         |
| `apps/admin/components/editor/ComponentPropsPanel.test.tsx` | 独自コンポーネントの判定、出演者一覧のフォーム（初期値・タグの選択順・スイッチ・無効化）、props なしの表示                                               |
| `apps/admin/components/editor/ArtistListPropsForm.test.tsx` | スイッチの初期値・切り替え、タグのチェックボックスの並びと無効化                                                                                         |

```
bun run format     ✅
bun run lint       ✅
bun run typecheck  ✅
bun run test       ✅
bun run build      ✅
```

画面の導線は触っていないので e2e は回していない。

### 動作確認（ローカル）

Playwright（headless Chromium）で、ログイン済みのセッションを入れ、記事 API の返事を差し替えて確認した（fesp-dev にデータを作らないため）。web は `--port 5188`、admin は `--port 3018` で立てて、確認後に止めた。

- ウェブアプリ（iPhone の幅 390px）
    - 出演者一覧: 日付タブ（すべて・Day1 6/6(土)・Day2 6/7(日)）・検索・並び替え・タグタブ（すべて・バンド・ダンス）とカード5枚が出る
    - Day2 で3枚に、検索「ダンス」で「ダンス部」だけに、タグ「ダンス」で2枚に絞り込まれる。「名前順」でソラノネ→ダンス部→ハルカゼ団→ミント・パレード→吹奏楽部の順になる
    - 個別の形: Day1・軽音楽部・ソラノネ（`h1`）・アコースティックライブ・「1日目 10:20 - 11:00」・体育館ステージ・5名と、`/schedule`・`/map` のボタンが出る。セットリストは4曲
    - 横スクロールが出ない。コンソールエラーが出ない
- 管理者サイト
    - 3つのカードに要約・説明が出る。出演者一覧を選ぶとパネルに4つのスイッチとタグのチェックボックスが出る
    - 「並び替えを出す」を切り替える・タグを足すと、カードの要約が変わる
    - 出演者のサマリーを選ぶとパネルに「設定する項目はありません」と出る
    - `/setto` のスラッシュメニューに「セットリスト」が出て、挿入できる
    - 保存すると `PUT /api/articles/:id` の本文に3ブロックの props が入る
    - コンソールエラーが出ない

## 詰まった点

なし。

## 残課題

- [ ] `artists` テーブル・API・出演者一覧/個別ページ、仮データの差し替え、出演者とスケジュールの紐付け（#60）
- [ ] 一覧のタグのカンマ区切り（`parseNewsListTags` / `parseArtistListTags`）と、日付タブ・検索・タグタブの見た目を模擬店（#16）と共通化する
- [ ] テンプレートによるロック（#64）
- [ ] iPad の2ペイン（#67）
