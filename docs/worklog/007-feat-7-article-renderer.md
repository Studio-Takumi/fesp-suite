---
title: 記事レンダラを作る
issue: 7
branch: 'feat/#7-article-renderer'
date: 2026-09-15
---

# 007 feat: #7 記事レンダラを作る

## やったこと

ウェブアプリに、記事本文（BlockNoteのブロック配列）を React 要素に変換するレンダラと、ブロックの `type` → コンポーネントのレジストリを作った。
仮の記事ページ `/articles/:articleId` で、管理者サイトと同じ `GET /api/articles/:id` から記事を取って描画する。
描画できないブロックは、ブロック単位で取り除いて残りを描画する（前方互換）。

## 変更したファイル

| ファイル                                                      | 変更内容                                                                                    |
| ------------------------------------------------------------- | ------------------------------------------------------------------------------------------- |
| `docs/app.md`                                                 | 記事ページと本文の描画の仕様（別コミット）                                                  |
| `packages/schema/src/article.ts`                              | `parseArticleDocument`（ブロック単位の検証）と表示用の `articleViewResponseSchema` を追加   |
| `packages/schema/src/article.test.ts`                         | 追加したスキーマのテスト                                                                    |
| `apps/web/src/components/article/ArticleRenderer.tsx`         | 新規。ブロック配列を上から辿って描画する。続いているリスト項目を `<ul>` / `<ol>` にまとめる |
| `apps/web/src/components/article/block-registry.ts`           | 新規。`type` → コンポーネントのレジストリ                                                   |
| `apps/web/src/components/article/blocks/*.tsx`                | 新規。段落・見出し・リスト項目・チェックリスト・トグル・引用・区切り線・表・コードブロック  |
| `apps/web/src/components/article/InlineContent.tsx`           | 新規。装飾つきの文字・リンク                                                                |
| `apps/web/src/components/article/link-protocol.ts`            | 新規。リンクにしてよいプロトコルの判定                                                      |
| `apps/web/src/pages/ArticlePage.tsx`                          | 新規。記事ページ（タイトル＋本文）                                                          |
| `apps/web/src/router.tsx`                                     | `/articles/$articleId` を追加                                                               |
| `apps/web/src/lib/queries.ts`                                 | `articleQuery` を追加                                                                       |
| `apps/web/src/lib/env.ts` / `.env.example` / `.env.test`      | `VITE_EVENT_ID` を追加                                                                      |
| `.env.example`                                                | `VITE_EVENT_ID` を追記                                                                      |
| `.github/workflows/ci.yml` / `deploy.yml`                     | `VITE_EVENT_ID`（CI はダミー値、deploy は `vars`）を追加                                    |
| `apps/web/README.md`                                          | 環境変数の表とディレクトリ構成を追記                                                        |
| `apps/web/src/**/*.test.tsx` / `apps/web/e2e/article.spec.ts` | 新規。レンダラ・記事ページのテストと E2E                                                    |

## 実装メモ

- **検証（`parseArticleDocument`）は `packages/schema` に置いた。** 記事ドキュメントの正本と同じ場所にあれば、#24 で独自コンポーネントをスキーマに足したときにそのまま検証も通るため
- **ブロックは子を空にして検証し、子は別に再帰で検証する。** `articleBlockSchema` は子まで丸ごと検証するので、そのまま使うと壊れた子が1つあるだけで親ごと消えてしまう
- **取得時に `articleViewResponseSchema` で `content` を「配列であること」だけ見てから、描画できるブロックに絞る。** 既存の `articleResponseSchema` は知らないブロックがあると記事全体を拒否し、ページ全体がエラー表示になるため。API の保存時の検証（厳しい方）はそのまま
- **レジストリはテキスト系ブロックも含めて1つにした。** 描画側は `type` を引くだけで、独自コンポーネントもここに1行足せば描ける。テストでは `ArticleRenderer` の `registry` を差し替える
- **リンクは `http:` / `https:` / `mailto:` / `tel:` のときだけ `<a>` にする。** スキーマの `z.url()` は `javascript:` も通すため、描画時に弾く（保存時の検証を締めるのは別の話なので触っていない）
- **見出しは1段下げた（レベル1→`h2`）。** ページタイトルが `h1` のため
- **表の見出しセルには `scope`（見出し行は `col`、見出し列は `row`）を付けた。** 付けないと、見出し列のセルが行の見出しとして読まれない
- **見た目は最低限にした（発注者と合意）。** 文字色・背景色・配置と、デザイン（`ui-design.pen` の News個別）への作り込みは #33 に切り出した
- **`event_id` は env（`VITE_EVENT_ID`）で固定した（発注者と合意）。** イベントを URL や認証から決める仕組みは後の Issue で扱う
- ローカルの `apps/web/.env` に、開発用イベント（#6 で作った `3718a7ab-…`）の `VITE_EVENT_ID` を設定済み

## テスト

| テスト                                                     | 検証内容                                                                                                                                                             |
| ---------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `packages/schema/src/article.test.ts`                      | 知らない `type`・壊れた props のブロックだけ子ごと除く、壊れた子だけ除いて親は残す、オブジェクトでない要素を除く、JSON 経由の区切り線・表、本文が配列でなければ拒否  |
| `apps/web/src/components/article/ArticleRenderer.test.tsx` | 各ブロックの要素、リストのまとめ方と `start`、ネスト、チェックリスト・トグル、表の見出しセルと `colspan`、文字の装飾、リンクの許可・拒否、レジストリの差し替え・欠け |
| `apps/web/src/pages/ArticlePage.test.tsx`                  | env のイベントを付けて取得、タイトルと本文、「（無題）」、描画できないブロックを含む記事、404 の表示                                                                 |
| `apps/web/e2e/article.spec.ts`                             | 記事ページを開くとタイトル・見出し・リスト・リンクが表示され、知らないブロックがあっても描画が続く                                                                   |

```
bun run format    ✅
bun run lint      ✅
bun run typecheck ✅
bun run test      ✅
bun run build     ✅
bun run e2e       web の chromium ✅ / mobile-safari ❌（ローカルに WebKit が無いため。#6 と同じ）
```

### 動作確認（ローカル + fesp-dev）

ヘッドレスの Chromium で、管理者サイトで作った実際の記事（見出し・箇条書き・チェックリスト・番号付きリスト・リンク・区切り線・表）を
`/articles/:articleId` で開き、すべて描画されること・コンソールエラーが出ないことを確認した。存在しない id では「ページが見つかりませんでした」が出る。

## 詰まった点

- **表の見出し列のセルが `rowheader` として見つからずテストが落ちた。** `<th>` に `scope` が無いと、Testing Library（とスクリーンリーダー）は
  列の見出しとして扱う。`scope='row'` を付けて直した

## 残課題

- [ ] GitHub の Variables に `VITE_EVENT_ID` を登録する（`deploy.yml` が参照する。発注者が行う）
- [ ] 見た目をデザインに合わせる・文字色などを反映する（#33）
- [ ] slug・URL から記事を引く（#29）
