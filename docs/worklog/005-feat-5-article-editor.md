---
title: 記事エディタ（テキスト・見出し・リスト）を作る
issue: 5
branch: 'feat/#5-article-editor'
date: 2026-09-14
---

# 005 feat: #5 記事エディタ（テキスト・見出し・リスト）を作る

## やったこと

記事本文の編集の土台として、TipTapベースのエディタ（テキスト・見出し・リスト）を管理者サイトに作った。
記事ドキュメント（doc/heading/paragraph/bulletList/orderedList/listItem/text）のzodスキーマを
`packages/schema` に定義した。

当初のIssueには独自コンポーネントノードの挿入・テンプレートによるロックも含まれていたが、
対象コンポーネント・テンプレートが未確定だったため grill-me で #24 に切り出し、
このIssueは素のリッチテキスト編集とスキーマの基本形までに絞った。

## 変更したファイル

| ファイル                                              | 変更内容                                                     |
| ------------------------------------------------------ | -------------------------------------------------------------- |
| `docs/admin.md`                                       | `/edit` ページの仕様を追加                                    |
| `packages/schema/src/article.ts`                      | 新規。記事ドキュメントのzodスキーマ（テキスト系ノードのみ）   |
| `packages/schema/src/article.test.ts`                 | 新規。妥当な記事JSONの受理・不正な構造の拒否のテスト           |
| `packages/schema/src/index.ts`                        | article を re-export                                          |
| `apps/admin/components/editor/article-editor.tsx`     | 新規。テキスト・見出し・リストを編集するTipTapエディタ         |
| `apps/admin/components/editor/article-editor.test.tsx`| 新規。表示・見出しトグル・フォーカス保持のテスト               |
| `apps/admin/app/(dashboard)/edit/page.tsx`            | 新規。`/edit` の暫定入口（in-memory・保存なし）               |
| `apps/admin/test/setup.ts`                            | jsdomに無い座標系API（`elementFromPoint`等）のpolyfillを追加   |

## 実装メモ

- **独自コンポーネントノード・テンプレートロックは #24 に切り出した**（理由: 対象コンポーネント・テンプレートが未確定で、決め打ちすると手戻りが大きいため）
- **既存の `collaborative-editor.tsx`（Yjs版）とは別に非同期のシンプルなエディタを新設**した（理由: このIssueでは共同編集を繋がないため。同期編集は既存コンポーネントの役割のまま残す）
- **StarterKitはテキスト・見出し・リストだけに絞った**（`blockquote` / `code` / `codeBlock` / `horizontalRule` / `strike` / `link` / `underline` を無効化）。見出しは `levels: [1, 2, 3]` のみ許可し、スキーマ側の制約と一致させた
- **`/edit` は一覧からの導線がまだないため直接アクセス用の暫定入口**にした。保存先もないため、下部にJSON（確認用）のdetailsパネルを置き、in-memoryの状態を目視確認できるようにした
- **依存パッケージの追加は不要だった**。TipTap関連は既にadmin側にインストール済み

## テスト

| テスト                                                   | 検証内容                                                             |
| --------------------------------------------------------- | ----------------------------------------------------------------------- |
| `packages/schema/src/article.test.ts`                    | 見出し・段落・（ネスト）リストを含む記事の受理、未知ノード・対象外の見出しレベル・doc以外のルートの拒否 |
| `apps/admin/components/editor/article-editor.test.tsx`   | 本文エディタの表示、見出し2トグルがJSONに反映されること、見出し4ボタンが無いこと、ツールバー操作後もDOMフォーカスがエディタに残ること |

```
bun run format    ✅
bun run lint      ✅
bun run typecheck ✅
bun run test      ✅
bun run build     ✅
```

`bun run dev` を実際に起動し、Playwright（headless Chromium）で見出し・太字・箇条書きリストの
一連の操作を行い、スクリーンショットとJSON出力を確認した。console エラーもなし。
`/edit` はサイドメニューから出さない仕様のため、導線をまたぐe2eは追加していない
（一覧からの導線は各一覧のIssueで接続する）。

## 詰まった点

- **ツールバーボタンをクリックした直後にEnterを押すと、直前の書式トグルが元に戻る不具合があった。**
  原因は `<button>` クリックでDOMフォーカスがボタン側に移り、TipTapの `.focus()` によるフォーカス復帰が
  次のキー入力に間に合わない場合があること。フォーカスが本文エディタに戻り切る前にEnterが送られると、
  ブラウザは「フォーカス中のボタンでEnter＝クリック」として扱い、直前のトグルコマンドを再実行してしまっていた。
  ツールバーボタンの `onMouseDown` で `preventDefault()` し、ボタンにDOMフォーカスが移ること自体を止めて解決した
  （`apps/admin/components/editor/article-editor.tsx` の `ToolbarButton`）。テスト実行時のPlaywrightの
  高速な連続操作で顕在化したが、実際の操作でも起こりうる不具合のため、回帰テストも追加した
- **jsdomに `document.elementFromPoint` 等の座標系APIが無く**、ProseMirrorがクリック処理時にエラーを投げていた。
  `apps/admin/test/setup.ts` に最小限のpolyfillを追加して解決した

## 残課題

- [ ] 独自コンポーネントノードの挿入・props編集・テンプレートによるロック（#24）
- [ ] 記事の保存先（#6）
- [ ] 各一覧ページから `/edit` への導線（各一覧のIssue）
