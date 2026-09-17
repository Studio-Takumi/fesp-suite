---
title: 記事エディタ：独自コンポーネントブロック（ページ見出し）に対応する
issue: 24
branch: 'feat/#24-page-header-component-block'
date: 2026-09-17
---

# 024 feat: #24 記事エディタ：独自コンポーネントブロック（ページ見出し）に対応する

## やったこと

最初の独自コンポーネントとして、ページ見出し `pageHeader`（`ui-design.pen` の PageHeader。英語ラベル＋日本語タイトル）を、schema・管理者サイトのブロック定義・ウェブアプリのレジストリの3点セットで追加した。
管理者サイトではスラッシュメニューの「コンポーネント」グループから挿入し、カーソルがある間だけ右のサイドパネルで props を編集する。
あわせて、ウェブアプリにデザインのフォント（Inter / Noto Sans JP）を入れた。

## 変更したファイル

| ファイル                                                   | 変更内容                                                                                        |
| ---------------------------------------------------------- | ----------------------------------------------------------------------------------------------- |
| `docs/admin.md`                                            | 記事エディタに「独自コンポーネントのブロック」「ページ見出し」を追記（別コミット）              |
| `docs/app.md`                                              | フォントと、本文の描画に `pageHeader` を追記（別コミット）                                      |
| `packages/schema/src/article.ts`                           | `pageHeaderPropsSchema` を追加し、記事ドキュメントのブロックに `pageHeader` を足す              |
| `apps/admin/components/editor/blocks/PageHeaderBlock.tsx`  | 追加。`createReactBlockSpec` で中身を持たない（`content: 'none'`）ブロックを定義                |
| `apps/admin/components/editor/ComponentPropsPanel.tsx`     | 追加。`type` → パネル名とフォームの対応表と、サイドパネル本体                                   |
| `apps/admin/components/editor/PageHeaderPropsForm.tsx`     | 追加。ページ見出しの props のフォーム（React Hook Form + zod）                                  |
| `apps/admin/components/editor/ArticleEditor.tsx`           | スキーマに `pageHeader`、スラッシュメニューに「ページ見出し」、エディタの右にサイドパネルを追加 |
| `apps/web/src/components/article/blocks/PageHeader.tsx`    | 追加。英語ラベル（Inter・大文字）と日本語タイトル（`h1`・Noto Sans JP）を `header` に出す       |
| `apps/web/src/components/article/block-registry.ts`        | `pageHeader` を登録                                                                             |
| `apps/web/src/index.css`                                   | フォントを読み込み、`font-en` / `font-jp` のテーマを追加。`body` の既定を `font-jp` にする      |
| `apps/web/package.json` / `bun.lock`                       | `@fontsource-variable/inter` / `@fontsource-variable/noto-sans-jp` を追加                       |
| `apps/admin/**/*.test.tsx` / `apps/web/**/*.test.tsx` など | テストを追加                                                                                    |

## 実装メモ

- **props のスキーマは `packages/schema` に1つだけ置き、サイドパネルのフォームもそれで検証する。** API は `articleDocumentSchema` 経由で同じ検証がかかるので、API のコードは触っていない
- **props に `trim` などの変換はかけない。** BlockNote の props にそのまま入る値なので、変換すると検証の前後で値がずれる
- **`content: z.undefined().optional()` にした。** 区切り線と同じく、BlockNote は `content: undefined` を入れ、JSON を経由するとキーごと消えるため
- **サイドパネルは `useEditorState` で「カーソルのあるブロック」を見て出し分ける。** パネルの入力欄にフォーカスが移っても、エディタの選択は残るのでパネルは閉じない。開いた直後はカーソルが先頭のブロックにあるので、先頭がページ見出しならパネルが出る（仕様どおり）
- **パネルからの反映は `editor.updateBlock` で行う。** 本文の変更として `onChange` が呼ばれるので、保存はこれまでどおり「保存」ボタンでまとめて行える
- **フォームはブロックの `id` を `key` にして作り直す。** 別のページ見出しに移ったとき、入力中の値やエラーを持ち越さないため。`onChange` も `id` が変わったときだけ作り直し、フォームの購読（`watch`）を張り直さないようにした
- **独自コンポーネントを足すときは、`ComponentPropsPanel.tsx` の対応表・`ArticleEditor.tsx` のスキーマとスラッシュメニュー・web のレジストリ・`packages/schema` に足す**
- **ページ見出しの日本語タイトルは `h1` にした（発注者と合意）。** 最初は記事ページのタイトル（`h1`）を残して `h2` にしたが、レビューで記事のタイトルは出さず本文だけにすることになった（下の「追記」）
- **フォントは `@fontsource-variable` で自前配信にした（発注者と合意）。** 外部 CDN に頼らないので、あとでオフライン対応（PWA）をするときもそのまま使える。`body` の既定が Noto Sans JP になるので、ウェブアプリの既存画面（ログインなど）の文字も変わる
- 管理者サイトのフォントは変えていない（見た目は shadcn 優先のため）
- **依存パッケージの追加は発注者の指示の範囲内**（「フォント入れたかったらこのタイミングで入れてもいい」で、入れ方は @fontsource を選んでもらった）

## テスト

| テスト                                                      | 検証内容                                                                                                                                                                           |
| ----------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `packages/schema/src/article.test.ts`                       | ページ見出しの受理（空・JSON 経由）、文字数の上限、props の欠け・型違い・余計な props・中身があるときの拒否、エラーメッセージ、`parseArticleDocument` で壊れたページ見出しだけ除く |
| `apps/admin/components/editor/ArticleEditor.test.tsx`       | 許可するブロックに `pageHeader` が入る、ラベル（大文字）とタイトルの表示、空のときの文言、カーソルの位置でパネルを出し分ける、パネルの入力で props が変わり `onChange` に渡る      |
| `apps/admin/components/editor/ComponentPropsPanel.test.tsx` | 独自コンポーネントの判定、コンポーネント名と初期値、入力するたびに props を渡す、文字数を超えたらエラーを出して props を渡さない                                                   |
| `apps/web/src/components/article/ArticleRenderer.test.tsx`  | 英語ラベル（大文字・Inter）と日本語タイトル（`h1`）を `header` に出す、空の行を出さない、両方とも空なら `header` ごと出さない                                                      |

```
bun run format    ✅
bun run lint      ✅
bun run typecheck ✅
bun run test      ✅
bun run build     ✅
```

### 動作確認（ローカル）

Playwright（headless Chromium）で、ログイン済みのセッションを入れ、API の返事を差し替えて確認した（fesp-dev にテスト用のデータを作らないため）。

- 管理者サイトで `/` を打つと「コンポーネント」グループに「ページ見出し」が出て、選ぶと入力を促す文言のブロックが入り、サイドパネルが開く
- パネルで入力するとエディタ上の見出しに反映され、英語ラベルは大文字で出る。31文字入れるとエラーが出る
- 段落をクリックするとパネルが閉じ、ページ見出しをクリックすると開いて、入力した値が残っている
- 保存すると `PUT /api/articles/:id` の本文に `pageHeader`（`{ label, title }`）が入る
- ウェブアプリの記事ページで、ラベルが Inter、タイトルと本文が Noto Sans JP で出て、フォントも読み込めている
- コンソールエラーが出ない

## 詰まった点

- **スラッシュメニューから入れた直後にサイドパネルが開かなかった。** `insertOrUpdateBlockForSlashMenu` は中身の無いブロックを入れると、カーソルを次のブロックに移す。入れたブロックを `editor.setTextCursorPosition` でカーソル位置に戻して解決した。jsdom ではスラッシュメニューを操作できないため、実ブラウザでだけ確認している
- **ローカルの API（`wrangler dev`）が応答しなくなっていた。** 発注者の許可を取って `bun run dev` を立ち上げ直した

## 追記: 記事ページで記事のタイトルを出さない

レビューで「ウェブアプリでは記事のタイトルを出さず、本文だけでいい」となった。

- 記事ページ（`ArticlePage.tsx`）から記事のタイトルの `h1`（空なら「（無題）」）を消した
- ページに `h1` が無くなるので、ページ見出しの日本語タイトルを `h1` にした（発注者と合意）。本文の見出しは今までどおり1段下げる（レベル1→`h2`）
- `ArticlePage.test.tsx` の「（無題）」のテストを、記事のタイトルを出さずページ見出しが唯一の `h1` になるテストに置き換えた
- e2e（`article.spec.ts` / `auth.spec.ts`）も、記事のタイトルではなくページ見出しの `h1` を見るようにした

```
bun run format    ✅
bun run lint      ✅
bun run typecheck ✅
bun run test      ✅
bun run build     ✅
bun run e2e       ✅（web は chromium・mobile-safari とも）
```

## 残課題

- [ ] テンプレートによるロック（#64）
- [ ] ウェブアプリの本文のブロックの見た目をデザインに合わせる（#33）
