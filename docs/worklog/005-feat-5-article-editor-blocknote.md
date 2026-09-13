---
title: 記事エディタ（テキスト・見出し・リスト）を作る
issue: 5
branch: 'feat/#5-article-editor-blocknote'
date: 2026-09-14
---

# 005 feat: #5 記事エディタ（テキスト・見出し・リスト）をBlockNoteで作る

## やったこと

記事本文編集の土台として、BlockNote（Notionライクなブロックエディタ）ベースのエディタを
管理者サイトに作った。記事ドキュメント（BlockNoteのブロック配列JSON）のzodスキーマを
`packages/schema` に定義した。

最初はTipTapで実装した（PR #25）が、実装後の比較検討で「BlockNoteの方がNotionっぽい
編集体験を作りやすく、独自コンポーネントを『propsだけ持つ専用ブロック』として自然に
表現できる」と判断し、PR #25はcloseしてBlockNoteで作り直した。独自コンポーネントノード・
テンプレートロックは対象・仕様未確定のため #24 に切り出し、このIssueはスコープ外。

その後、発注者の指示でチェックリスト（`checkListItem`）・トグルリスト（`toggleListItem`）・
引用（`quote`）・区切り線（`divider`）・表（`table`）も追加した。画像・動画・音声・
添付ファイル・コードブロックはR2アップロード等が絡むため引き続き対象外。

## 変更したファイル

| ファイル                                               | 変更内容                                                              |
| ------------------------------------------------------ | --------------------------------------------------------------------- |
| `docs/article-system.md`                               | TipTap/ProseMirror前提の記述をBlockNoteのブロック配列モデルに書き換え |
| `docs/admin.md`                                        | `/edit` ページの仕様を追加（BlockNote表記）                           |
| `README.md`                                            | 構成図のadmin行をBlockNote表記に変更                                  |
| `packages/schema/src/article.ts`                       | 新規。記事ドキュメント（BlockNoteの`Block[]`）のzodスキーマ           |
| `packages/schema/src/article.test.ts`                  | 新規。妥当な記事JSONの受理・不正な構造の拒否のテスト                  |
| `packages/schema/src/index.ts`                         | article を re-export                                                  |
| `apps/admin/components/editor/article-editor.tsx`      | 新規。BlockNoteベースの記事エディタ                                   |
| `apps/admin/components/editor/article-editor.test.tsx` | 新規。表示・スキーマ制限のテスト                                      |
| `apps/admin/app/(dashboard)/edit/page.tsx`             | 新規。`/edit` の暫定入口（in-memory・保存なし）                       |
| `apps/admin/test/setup.ts`                             | jsdomに無い座標系API（`elementFromPoint`等）のpolyfillを追加          |
| `apps/admin/package.json` / `bun.lock`                 | `@blocknote/core` `@blocknote/react` `@blocknote/shadcn` を追加       |

## 実装メモ

- **独自コンポーネントノード・テンプレートロックは #24 に切り出した**（TipTap版から変わらず）
- **`BlockNoteSchema.create` でブロック種別をparagraph/heading/bulletListItem/numberedListItem
  の4つに絞った。** 画像・テーブル・コードブロック・チェックリスト・トグル見出し・区切り線等は
  含めない（「テキスト・見出し・リスト」というIssueの範囲に合わせるため）。スラッシュメニューにも
  この4種類しか出ないことをブラウザで確認した
- **見出しレベル(1〜6)・背景色/文字色/文字寄せといったBlockNote標準のprops・スタイルは
  そのまま許可した。** ブロック種別ごとのpropSchemaを絞るには各ブロックスペックを自前で
  再実装する必要があり、コストの割にメリットが薄い（むしろBlockNoteを選んだ理由である
  「Notionっぽさ」を削ることになる）と判断した。TipTap版では見出しを1〜3・スタイルを
  太字/斜体のみに絞っていたが、この判断は引き継がなかった
- **UIは`@blocknote/shadcn`を採用。** 管理者サイトが既にshadcn/ui前提（cva・clsx・
  tailwind-merge・lucide-react）のため、依存の重複が最小で済む
- **`ja`辞書（`@blocknote/core/locales`）を渡して日本語化した。** 既定は英語UIだったため
- **BlockNoteのエディタ生成は`window`に依存しSSR不可**。`/edit`ページ側で`next/dynamic`
  （`ssr: false`）を使ってクライアント限定で読み込む
- **依存パッケージの追加は指示の範囲内**（「BlockNoteに乗り換えよう」の明示的な指示）
- **quote/table/tableCellはbulletListItem等とprops・stylesの形が違う。** quoteは
  `textAlignment`を持たない、tableは`textColor`しか持たない（配置・背景色はセル側の
  `tableCell`が持つ）。BlockNote本体の`defaultBlockSpecs`の型定義に合わせてそれぞれ専用の
  props schemaを定義し、**`.strict()`で誤った組み合わせ（例: quoteに`textAlignment`を
  渡す）を拒否する**ようにした（zodの`z.object`は既定で未知キーを黙って剥がすため、
  何もしないと「quoteにtextAlignmentを渡しても通ってしまう」テストが書けなかった）

## テスト

| テスト                                                 | 検証内容                                                                                                                                 |
| ------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------- |
| `packages/schema/src/article.test.ts`                  | 見出し・段落・（childrenでネストした）リスト・リンクの受理、未対応ブロック種別・対象外の見出しレベル・未定義の色・配列以外のルートの拒否 |
| `apps/admin/components/editor/article-editor.test.tsx` | 許可するブロック種別が4つに絞られていること、本文エディタの表示、`content`で渡した記事の中身が表示されること                             |

```
bun run format    ✅
bun run lint      ✅
bun run typecheck ✅
bun run test      ✅
bun run build     ✅
```

`bun run dev` を実際に起動し、Playwright（headless Chromium）で以下を確認した。

- Markdownショートカット（`# ` → 見出し、`- ` → 箇条書き、`> ` → 引用、`[] ` → チェックリスト、
  `---` → 区切り線）が効くこと
- テキスト選択時のフローティングツールバーが表示されること
- `/` のスラッシュメニューに許可した9種類のブロックのみ出て、画像・動画・コードブロック等は
  出ないこと
- プレースホルダー等のUI文言が日本語化されていること
- console エラーが出ないこと

`/edit` はサイドメニューから出さない仕様のため、導線をまたぐe2eは追加していない
（一覧からの導線は各一覧のIssueで接続する）。

## 詰まった点

- **BlockNoteのエディタ生成時に`ReferenceError: window is not defined`でSSRが落ちた。**
  `useCreateBlockNote`がエディタ生成時にブラウザAPIへ依存しているため。`next/dynamic`の
  `ssr: false`でクライアント限定にして解決した
- **`jsdom`にProseMirror（BlockNoteの内部実装）が使う座標系API
  （`elementFromPoint` / `elementsFromPoint` / `Range.getClientRects` /
  `Range.getBoundingClientRect`）が無く、クリックやフローティングUIの位置計算でエラーになった。**
  `apps/admin/test/setup.ts`に最小限のpolyfillを追加して解決した
- **jsdomでは実際のキー入力をProseMirror系エディタに反映させられない。** `userEvent.type`/
  `userEvent.keyboard`でcontentEditableに文字を打っても、BlockNote（内部はProseMirror）側の
  ドキュメントは更新されず`onChange`も発火しなかった。ProseMirrorは`beforeinput`やブラウザ
  ネイティブのcontentEditable編集をもとに更新する仕組みで、jsdomはそこまで再現しないため
  （TipTap版のときはトグルボタンのクリック＝コマンド実行だけをテストしていたので気づかな
  かった）。**「入力してonChangeが更新される」ことのテストは諦め**、`content`プロップで
  渡した記事が正しく表示されることのテストに置き換えた。実際に入力できることは
  Playwright（実ブラウザ）での手動確認で担保した

## 追記: スラッシュメニューの調整・コードブロックのハイライト

実装後のレビューで以下を追加した。

- **スラッシュメニュー・絵文字ピッカーをNotion風にコンパクト化**（`SlashMenuItem` /
  `SlashMenuRoot` / `EmojiGridRoot`）。項目の説明を常時表示せずホバーのツールチップにし、
  外枠を`max-h-80`で一定の高さに抑えてスクロールさせる
- **`.bn-inline-content code`にスタイル追加**。BlockNote標準はmonospace指定のみで
  背景が無く目立たなかったため
- **コードブロックにShikiでシンタックスハイライトを追加**。対応言語はhtml/css/
  javascript/typescript/json/yaml/markdownの7つ（発注者指定）。テーマは
  コードブロックの背景がダーク固定のため`github-dark`
- 独自コンポーネントノードの挿入・テンプレートによるロックは変わらず#24
- Markdownのリストを空でない段落の途中に貼り付けると先頭項目がリスト化されない不具合を
  発見し、#28として切り出した（詳細は残課題を参照）
- スラッシュメニューにリンクを追加する案は一度実装したが（`editor.createLink`で
  プレースホルダーを挿入し、標準のLinkToolbarで編集する形）、発注者の判断で見送り、
  コミットをrevertした

## 残課題

- [ ] 独自コンポーネントブロックの挿入・props編集・テンプレートによるロック（#24）
- [ ] 記事の保存先（#6）
- [ ] 各一覧ページから `/edit` への導線（各一覧のIssue）
- [ ] 空でない段落の途中にMarkdownのリストを貼り付けると先頭項目がリスト化されない（#28。
      原因はBlockNote本体の`transformPasted`で、外部から差し替えできないため
      `pasteHandler`側での回避策が必要。今回は着手しない）
