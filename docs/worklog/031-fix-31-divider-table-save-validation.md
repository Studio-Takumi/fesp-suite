---
title: 区切り線・表を含む記事を保存すると「入力値が不正です」で保存できない
issue: 31
branch: 'fix/#31-divider-table-save-validation'
date: 2026-09-15
---

# 031 fix: #31 区切り線・表を含む記事を保存すると「入力値が不正です」で保存できない

## やったこと

記事ドキュメントの zod スキーマを、BlockNote の出力を **JSON にシリアライズした後の形**でも受理するように直した。
区切り線・表を含む記事を保存でき、読み込み時のレスポンス検証も通るようになった。

## 変更したファイル

| ファイル                               | 変更内容                                                                                   |
| -------------------------------------- | ------------------------------------------------------------------------------------------ |
| `packages/schema/src/article.ts`       | divider の `content` をキー省略可にし、表の `columnWidths` の `null` を `undefined` に戻す |
| `packages/schema/src/article.test.ts`  | JSON を経由した区切り線・表を受理するテスト、列幅に数値以外が入ったら拒否するテスト        |
| `apps/api/src/routes/articles.test.ts` | 区切り線・表を含む本文を `PUT` で保存できるテスト                                          |

## 実装メモ

- **原因は JSON シリアライズでの形のズレ。** divider の `content: undefined` はキーごと消え、表の
  `columnWidths: [undefined, …]`（列幅をドラッグしていない列）は `[null, …]` になる。スキーマは
  `editor.document`（JS オブジェクト）の形に合わせてあり、どちらも弾いていた
- **divider の `content` は `z.undefined().optional()` にした。** 手書きの `ArticleBlock` 型も
  `content?:` に揃えた（`z.ZodType<ArticleBlock>` と型が合わなくなるため）
- **`columnWidths` は `null` を受理したうえで `undefined` に変換する（`.nullish().transform()`）。**
  方針の段階では `nullish()` だけの予定だったが、それだと出力型に `null` が入り、`ArticleEditor` で BlockNote の
  `initialContent`（`(number | undefined)[]`）に渡すところで admin の build が落ちた。
  変換しておけば、GET で読み込んだ本文も BlockNote が期待する形のままエディタに渡せる
- **DB の jsonb にはどのみち `null` として入る。** 読み込み時にスキーマを通すので問題ない

## テスト

| テスト                                 | 検証内容                                                                     |
| -------------------------------------- | ---------------------------------------------------------------------------- |
| `packages/schema/src/article.test.ts`  | JSON を経由した divider・表を受理し、列幅の `null` が `undefined` に戻ること |
| `apps/api/src/routes/articles.test.ts` | エディタの出力をそのまま JSON で `PUT` しても 400 にならず保存されること     |

修正を外した状態で、追加したテストが落ちることも確認した。
E2E は画面の導線を触っていないため実行していない。

```
bun run format   ✅
bun run lint     ✅
bun run typecheck ✅
bun run test     ✅
bun run build    ✅
```

## 詰まった点

- **既存テストが通っていたのに本番で落ちた。** テストが JS オブジェクトを直接 `safeParse` しており、
  JSON を経由していなかったため。エディタの出力を検証するテストは `JSON.parse(JSON.stringify(doc))` を通す

## 残課題

なし
