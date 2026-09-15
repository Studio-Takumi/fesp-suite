---
title: 既存コンポーネントファイル名をkebab-caseからPascalCaseに揃える
issue: 23
branch: 'chore/#23-pascal-case-component-files'
date: 2026-09-15
---

# 023 chore: #23 既存コンポーネントファイル名をkebab-caseからPascalCaseに揃える

## やったこと

自作の React コンポーネントのファイル名を PascalCase にリネームし、import 元と README のディレクトリ図を追従させた。
shadcn・Next.js・React の仕組み側で名前が決まるファイルは小文字のまま残した。

## 変更したファイル

| ファイル                                                            | 変更内容                                                                           |
| ------------------------------------------------------------------- | ---------------------------------------------------------------------------------- |
| `apps/admin/components/editor/collaborative-editor.tsx`             | → `CollaborativeEditor.tsx`                                                        |
| `apps/admin/components/example/data-table.tsx`（+ test）            | → `DataTable.tsx`（+ test）                                                        |
| `apps/admin/components/example/example-form.tsx`（+ test）          | → `ExampleForm.tsx`（+ test）                                                      |
| `apps/admin/app/providers.tsx`                                      | → `Providers.tsx`。`app/layout.tsx` の import                                      |
| `apps/lp/components/hero.tsx` / `scroll-section.tsx`                | → `Hero.tsx` / `ScrollSection.tsx`。`app/page.tsx` の import                       |
| `apps/web/src/components/app-shell.tsx` / `query-boundary.tsx`      | → `AppShell.tsx` / `QueryBoundary.tsx`。`router.tsx` / `ArticlePage.tsx` の import |
| `apps/web/src/pages/home.tsx`（+ test）                             | → `HomePage.tsx`（+ test）。`router.tsx` の import                                 |
| `packages/ui/src/components/empty-state.tsx`                        | → `EmptyState.tsx`。`src/index.ts` の export                                       |
| `apps/admin/components/editor/ArticleEditor.tsx`                    | コメント内のファイル名                                                             |
| `apps/admin/README.md` / `apps/web/README.md` / `apps/lp/README.md` | ディレクトリ図のファイル名                                                         |

## 実装メモ

- **PascalCase にするのは自作のコンポーネントだけにした。** 小文字のまま残したのは、shadcn の部品（`apps/admin/components/ui/*`、`packages/ui` の `button` / `card` / `spinner`）、Next.js の予約ファイル、`main.tsx` / `router.tsx` / `test/render.tsx`（発注者と合意）
- **Issue の一覧に無い `providers.tsx` / `hero.tsx` / `home.tsx` も対象にした。** 自作のコンポーネントなので同じルールに揃えた（発注者と合意）
- **`home.tsx` は `Home.tsx` ではなく `HomePage.tsx` にした。** export 名が `HomePage` で、web の他のページも `LoginPage.tsx` の形なので、export 名とファイル名を一致させた
- **大文字小文字だけのリネーム（`hero` → `Hero`、`providers` → `Providers`）は `git mv` を2回に分けた。** macOS の大文字小文字を区別しないファイルシステムでは1回の `git mv` だと git が変更を拾わず、Linux の CI で import が解決できなくなるため
- **`docs/conventions.md` は触っていない。** 「editor 配下は直すこと自体を目的にした変更はしない」の一文と、その中の `collaborative-editor.tsx` の表記は残っている（発注者の指示）
- `@fesp/ui` の shadcn 形の部品を本家に置き換えてから（#47）リネームしたので、このブランチは #47 のブランチから切っている

## テスト

テストの追加はなし。リネームしたテスト（`DataTable.test.tsx` / `ExampleForm.test.tsx` / `HomePage.test.tsx`）がそのまま通ることと、typecheck / build で import の解決を確認した。画面の導線は変えていないので e2e は回していない。

```
bun run format    ✅
bun run lint      ✅
bun run typecheck ✅
bun run test      ✅
bun run build     ✅
```

## 詰まった点

なし

## 残課題

なし
