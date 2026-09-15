---
title: 管理者サイトの UI 部品を shadcn/ui 本家に置き換える
issue: 47
branch: 'chore/#47-shadcn-upstream-ui'
date: 2026-09-15
---

# 047 chore: #47 管理者サイトの UI 部品を shadcn/ui 本家に置き換える

## やったこと

管理者サイトの `components/ui/`（`button` / `input` / `label` / `table` / `switch`）と、`@fesp/ui` の shadcn 形の部品（`button` / `card` / `spinner`）を、`shadcn add --overwrite` で本家のものに置き換えた。
`packages/ui` にも `components.json` を置き、`packages/ui` の中で `shadcn add` を実行すれば部品を足せるようにした。

## 変更したファイル

| ファイル                                                         | 変更内容                                                                                                           |
| ---------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------ |
| `apps/admin/components/ui/{button,input,label,table,switch}.tsx` | shadcn 本家（`new-york`）で上書き。`Button` に `asChild`、`Label` が Radix に                                      |
| `packages/ui/components.json`                                    | 新規。style・baseColor・iconLibrary は admin と揃え、エイリアスは `package.json#imports`（`#components` / `#lib`） |
| `packages/ui/package.json` / `bun.lock`                          | `imports` を追加。CLI が `cn` と `radix-ui` を依存に追加した（admin と同じバージョン）                             |
| `packages/ui/src/components/{button,card,spinner}.tsx`           | shadcn 本家で上書き                                                                                                |
| `packages/ui/src/index.ts`                                       | 本家に無い `ButtonProps` / `SpinnerProps` の export を削除、`CardAction` を追加                                    |
| `packages/ui/src/components/button.test.tsx`                     | 「既定で `type=button`」を削除し、`asChild` のテストを追加                                                         |
| `apps/web/src/components/query-boundary.tsx`                     | 本家の `Spinner` は `aria-label="Loading"` なので、呼び出し側で `aria-label='読み込み中'` を渡す                   |

## 実装メモ

- **style は `new-york` のまま。** 既存の `components.json` と同じ（発注者と合意）
- **テーマトークンは `@fesp/config/tailwind/preset.css` のものを残した。** 名前・値がすでに shadcn の neutral 既定とほぼ同じで、本家の部品がそのまま動く。admin の sky の上書きも維持（発注者と合意）
- **手書き版の独自挙動は残していない。** `Button` の `type='button'` 既定は外した（発注者と合意）。今 `type` を省略している `Button`（DataTable の並び替え・共同編集の保存）はフォームの外なので挙動は変わらない。`Input` の `aria-invalid` の赤枠は本家にもある
- **見た目は本家に合わせ、`ui-design.pen` との差は追っていない。** 管理者サイトはデザインに強くこだわらない（発注者と合意）
- **`import { cn } from 'cn'` は本家の出力のままにした。** #10 では `components.json` の `utils` エイリアスが反映されない CLI の不具合とみなして `~/lib/utils` に手で直していたが、本家のレジストリが `cn`（shadcn-ui/cn、`clsx` + `tailwind-merge` の置き換え）を依存として明示しているので、そちらが正しい出力。手で直すと `shadcn add --overwrite` のたびに差分が出るので揃えた。アプリ側のコード（`~/lib/utils` / `@fesp/ui` の `cn`）は触っていない
- **`packages/ui` の `components.json` は `package.json#imports` を使う形にした。** shadcn のモノレポのドキュメントの形。tsconfig の `paths` を足さずに済む。今回の3部品は `cn` を直接 import するので、`#lib/cn` などのエイリアスは実際には使われていない
- **本家の部品のファイル名は小文字のまま。** CLI の出力に合わせる。PascalCase にするのは自作コンポーネントだけ（#23）
- 本家のコードは Tailwind の任意値（`ring-[3px]`）や `.5` 刻み（`px-2.5`）を含むが、`docs/conventions.md` の Tailwind のルールは自前のコードに向けたものとして、手を入れていない

## テスト

| テスト                                       | 検証内容                                                                             |
| -------------------------------------------- | ------------------------------------------------------------------------------------ |
| `packages/ui/src/components/button.test.tsx` | 子要素の描画、クリック、disabled、variant のクラス、`asChild` で子要素に見た目を渡す |

既存の画面のテスト（ArticleList / ArticleEditView / DataTable / ExampleForm / AuthForm / AdminSidebar / web の各ページ）はそのまま通った。

```
bun run format    ✅
bun run lint      ✅
bun run typecheck ✅
bun run test      ✅
bun run build     ✅
bun run e2e       ✅（web 8。admin は既存の skip 1）
```

画面は dev サーバーで admin のログイン画面を目視した。記事一覧・記事編集・web のホームはログインが必要で、ローカルの Supabase を起動していなかったので目視していない。

## 詰まった点

- **`shadcn add` が `import { cn } from "cn"` を出す。** 上の実装メモのとおり、本家の正しい出力なのでそのまま使う。#10 の作業ログの「手で直した」とは扱いを変えた

## 残課題

- [ ] 記事一覧・記事編集の画面の見た目を、ログインした状態で目視する（レビュー時）
