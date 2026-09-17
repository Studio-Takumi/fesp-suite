---
title: お知らせ（News）の独自コンポーネントを作る
issue: 13
branch: 'feat/#13-news-component-blocks'
date: 2026-09-18
---

# 013 feat: #13 お知らせ（News）の独自コンポーネントを作る

## やったこと

お知らせ一覧 `newsList`・記事の画像 `coverImage`・記事のサマリー `postSummary`・前後の記事 `adjacentPosts` の4つの独自コンポーネントを、schema・ウェブアプリのレジストリ・管理者サイトのブロック定義の3点セットで追加した。
表示するデータは API ができるまで仮データを `lib/queries.ts` の queryOptions から返す。あわせて、一覧が0件のときの共通の空状態 `EmptyState` をウェブアプリに作り、管理者サイトでは props を持たないコンポーネントを選んだときにパネルへ「設定する項目はありません」と出す仕組みを足した。

## 変更したファイル

| ファイル                                                                         | 変更内容                                                                                           |
| -------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------- |
| `docs/app.md`                                                                    | 本文の描画の表に4ブロック、ブロックごとの節と「一覧の空状態」を追記（別コミット）                  |
| `docs/admin.md`                                                                  | コンポーネントの表に4ブロック、ブロックごとの節と「設定する項目はありません」を追記（別コミット）  |
| `packages/schema/src/article.ts`                                                 | 4ブロックの props スキーマ・`parseNewsListTags` を追加し、記事ドキュメントのブロックに足す         |
| `apps/web/src/components/article/blocks/NewsList.tsx`                            | 追加。タグのタブ（絞り込み）・お知らせの行・「すべて見る」・0件なら空状態                          |
| `apps/web/src/components/article/blocks/CoverImage.tsx`                          | 追加。画面の幅いっぱい・16:9 の画像。URL が空なら出さない                                          |
| `apps/web/src/components/article/blocks/PostSummary.tsx`                         | 追加。作成者・更新日時・タグ                                                                       |
| `apps/web/src/components/article/blocks/AdjacentPosts.tsx`                       | 追加。前の記事・次の記事へのリンク                                                                 |
| `apps/web/src/components/news/NewsRow.tsx`                                       | 追加。お知らせ一覧の1行（デザインの NewsRow）                                                      |
| `apps/web/src/components/EmptyState.tsx`                                         | 追加。一覧の空状態（見出し・説明・再読み込み）                                                     |
| `apps/web/src/components/article/block-registry.ts`                              | 4ブロックを登録                                                                                    |
| `apps/web/src/lib/mock/news.ts` / `apps/web/src/lib/queries.ts`                  | 追加。お知らせ・タグ・表示中の記事・前後の記事の仮データと queryOptions                            |
| `apps/admin/components/editor/blocks/*Block.tsx`                                 | 追加。4ブロックの定義。カードには設定の要約・説明だけを出す                                        |
| `apps/admin/components/editor/NewsListPropsForm.tsx` / `CoverImagePropsForm.tsx` | 追加。props のフォーム（React Hook Form + zod）                                                    |
| `apps/admin/components/editor/ComponentPropsPanel.tsx`                           | 対応表に4ブロックを足し、`renderForm` を持たないコンポーネントは「設定する項目はありません」と出す |
| `apps/admin/components/editor/ArticleEditor.tsx`                                 | スキーマに4ブロック、スラッシュメニューの「コンポーネント」グループを配列にして4項目を足す         |
| `apps/admin/components/ui/checkbox.tsx`                                          | 追加。shadcn の Checkbox（既存の `radix-ui` を使う。依存パッケージは増やしていない）               |
| `apps/admin/lib/mock/news.ts` / `apps/admin/lib/queries.ts`                      | 追加。タグの仮データと queryOptions                                                                |
| `**/*.test.ts(x)`                                                                | テストを追加                                                                                       |

## 実装メモ

- **`newsList` のタブに出すタグ（`tags`）は、タグの ID をカンマ区切りで並べた文字列にした。** BlockNote の props は文字列・数値・真偽値しか持てないため（`docs/article-system.md` の例は配列だが、そのままでは入らない）。空の ID（`a,,b` など）は schema で拒否する。タブの並びは選んだ順ではなくタグの一覧の順
- **表示件数（`limit`）は `{ default: undefined, type: 'number' }` にした。** `numberedListItem` の `start` と同じ形で、空なら props から消える（JSON を経由するとキーが無い）ことを `ArticleEditor.test.tsx` とブラウザで確かめた
- **タグタブを出す設定でも、タグを1つも選んでいなければタブを出さない。** 「すべて」だけのタブは意味がないため。表示件数はタブで絞り込んだあとに数える
- **行・前後の記事のリンク先は `/news/:id`、「すべて見る」は `/news` にした。** まだルートが無いので TanStack Router の `Link` は型で通らず、`<a href>` にしている（ページができたら `Link` にする）
- **表示中の記事（サマリー・前後の記事）は、仮データの1件（`mockCurrentPost`）とその前後を返す。** 前の記事は1つ古い記事、次の記事は1つ新しい記事
- **日付はデザインどおりゼロ埋めしない（「6月」「2026年6月6日」）。** `dateFormatter` の `MM` / `DD` を `Number()` で戻した。`@fesp/ui` にトークンを足すのは他の並列ブランチと衝突しやすいので見送った
- **NewsRow の日付の背景は、コンポーネント定義どおり `slate-50` に揃えた。** デザインの News一覧では上3件だけ `sky-50` になっているが、条件（今日・未読など）が決まっていないため
- **記事の画像はデザインどおり画面の端まで出すため、`-mx-4` で AppShell の左右の余白を打ち消している。** AppShell の余白を変えたら合わせる必要がある。`alt` は空（装飾扱い）
- **`coverImage` の URL は `http` / `https` だけ受け付ける**（`javascript:` などを `img` に入れないため）
- **ウェブアプリの空状態は `@fesp/ui` の既存の `EmptyState` を使わず、指示どおり `apps/web/src/components/EmptyState.tsx` に作った。** デザインの「状態: 空」（丸の中のアイコン・再読み込みボタン）と見た目が違い、#15 も同じパス・同じ props で作るため
- **データを読むブロックは `QueryBoundary` で読み込み中・失敗を出す。** 取得の単位をコンポーネントにする方針（`docs/article-system.md`）どおり
- **管理者サイトのカードは設定の要約だけを出し、お知らせのプレビューはしない。** タグの名前を出すため、お知らせ一覧のカードだけタグの仮データを読む
- **`ComponentPropsPanel` の対応表は `renderForm` を省略できるようにし、省略したコンポーネントは「設定する項目はありません」と出す。** `type` ごとに引いたフォームと block の型の対応を TypeScript が追えないので、描画する関数で型を合わせている
- **`ArticleEditor.tsx` のカーソル位置のブロックは `ComponentBlock` に型を合わせている。** BlockNote のブロックの型が `type` と `props` の対応を持たず、ブロックが2種類以上になると代入できないため
- スラッシュメニューの「コンポーネント」の項目は配列（`componentSlashMenuItems`）にまとめ、挿入してカーソルを戻す処理を共通にした

## テスト

| テスト                                                      | 検証内容                                                                                                                                                                                                |
| ----------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `packages/schema/src/article.test.ts`                       | 4ブロックの受理（挿入直後・JSON 経由で `limit` が消えた形）、表示件数・タグ・URL の不正、props の欠け・型違い・余計な props・中身の拒否、エラーメッセージ、`parseNewsListTags`                          |
| `apps/web/src/components/article/ArticleRenderer.test.tsx`  | お知らせの行（日付・投稿者・タグ・リンク）、タブの並びと絞り込み、タグ未選択でタブを出さない、表示件数（絞り込み後に数える）、「すべて見る」、0件の空状態、画像、サマリー、前後の記事（片方・両方無し） |
| `apps/web/src/components/EmptyState.test.tsx`               | 見出し・説明・再読み込みボタンを出し、押すと `onRetry` を呼ぶ                                                                                                                                           |
| `apps/admin/components/editor/ArticleEditor.test.tsx`       | 許可するブロックに4ブロックが入る、カードの要約・説明、props なしのブロックでパネルに「設定する項目はありません」、表示件数の入力と空にしたときに props から消える                                      |
| `apps/admin/components/editor/ComponentPropsPanel.test.tsx` | 独自コンポーネントの判定、お知らせ一覧のフォーム（初期値・タグの選択順・スイッチ・無効化・表示件数のエラー）、記事の画像のフォーム（エラーと反映）、props なしの表示                                    |

```
bun run format     ✅
bun run lint       ✅
bun run typecheck  ✅
bun run test       ✅
bun run build      ✅
```

画面の導線は触っていないので e2e は回していない。

### 動作確認（ローカル）

Playwright（headless Chromium）で、ログイン済みのセッションを入れ、記事 API の返事を差し替えて確認した（fesp-dev にデータを作らないため）。web は `--port 5181`、admin は `--port 3011` で立てて、確認後に止めた。

- ウェブアプリ（iPhone の幅 390px）
    - お知らせ一覧: タブ「すべて・ステージ・模擬店・前夜祭・お願い」と8件の行が出て、「ステージ」を押すと2件に絞り込まれる
    - ホームの形（表示件数 3・「すべて見る」あり）: 3件と「すべて見る」（`/news`）が出る
    - 個別の形: 画像が画面の幅いっぱい（390×219）に出て、サマリー（実行委員会本部 / 2026年6月6日 11:51 更新 / #ステージ #お知らせ）、前後の記事が出る
    - 横スクロールが出ない。コンソールエラーが出ない
- 管理者サイト
    - 4つのカードに要約・説明が出る。お知らせ一覧を選ぶとパネルにスイッチ・タグのチェックボックス・表示件数が出る
    - タグを足す・表示件数を空にするとカードの要約が変わる。表示件数 `0` でエラー、URL `javascript:alert(1)` でエラーが出る
    - 記事のサマリーを選ぶとパネルに「設定する項目はありません」と出る
    - `/` のメニューの「コンポーネント」に4項目が出て、`oshirase` で絞り込んでお知らせ一覧を入れるとパネルが開く
    - 保存すると `PUT /api/articles/:id` の本文に4ブロックの props が入る（空の表示件数はキーが無い）
    - コンソールエラーが出ない

## 詰まった点

- **管理者サイトのテストで `lib/queries.ts` の import から env の検証が落ちた。** お知らせ一覧のブロックとフォームがタグの queryOptions を読むようになったため。`ArticleEditView.test.tsx` と同じく `~/lib/env` と `~/lib/api` を差し替え、QueryClient の中で描画するようにした

## 残課題

- [ ] お知らせのテーブル・API・一覧/個別ページ、仮データの差し替え（#56）
- [ ] テンプレートによるロック（#64）
- [ ] iPad の2ペイン（#67）
