# @fesp/config — 共通設定

tsconfig / Tailwind プリセット / ESLint をモノレポで共有する。
設定を1か所に集約して、アプリ間のブレを防ぐためのパッケージ（コードは持たない）。

## tsconfig

```json
{ "extends": "@fesp/config/tsconfig/nextjs.json" }
```

| プリセット     | 用途                                                                  |
| -------------- | --------------------------------------------------------------------- |
| `base.json`    | 共通（strict / noUncheckedIndexedAccess / verbatimModuleSyntax など） |
| `library.json` | `packages/*`                                                          |
| `nextjs.json`  | LP・管理者サイト                                                      |
| `vite.json`    | ウェブアプリ                                                          |
| `workers.json` | API（Cloudflare Workers）                                             |

## Tailwind プリセット

Tailwind v4 は CSS ファースト設定なので、プリセットもCSSで提供している。

```css
@import '@fesp/config/tailwind/preset.css';
@source '../../../packages/ui/src'; /* 共通UIを使う場合 */
```

中身:

- セマンティックカラー（`--color-primary` `--color-muted-foreground` など）を
  CSS変数 → `@theme inline` でユーティリティ化。命名は shadcn/ui に合わせてある
- ダークテーマは `.dark` クラス方式（`@custom-variant dark`）
- 日本語フォントを含む `--font-sans`
- `prefers-reduced-motion` の尊重

**色を足すときは必ずライト/ダーク両方に定義する。**

## ESLint

フラット設定。アプリ側は1行 extends するだけ。

```js
// packages/* や apps/api
import base from "@fesp/config/eslint/base";
export default base;

// Vite + React
import react from "@fesp/config/eslint/react";
export default react;

// Next.js
import next from "@fesp/config/eslint/next";
export default [...next, { ignores: [".next/**"] }];
```

`next lint` は Next 16 で廃止されたため、Next アプリもこの共通設定を `eslint .` で使う。

## 注意

このパッケージ自体には lint / typecheck 対象がない（設定ファイルだけ）。
`bun run lint` はメッセージを出して終了する。
