# @fesp/ui — 共通UIコンポーネント

3フロントで共有する最小限のUI部品。**Tailwind v4 + lucide-react**。

## 使い方

ビルド不要。import するだけ（Next.js 側は `transpilePackages` 設定済み）。

```tsx
import { Button, Card, CardHeader, CardTitle, cn, EmptyState, Spinner } from '@fesp/ui'
```

Tailwind のクラスをスキャンさせるため、使う側のCSSに `@source` を1行足す必要がある
（各アプリの `globals.css` / `index.css` に設定済み）。

```css
@import '@fesp/config/tailwind/preset.css';
@source '../../../packages/ui/src';
```

## コンポーネント

| 名前         | 用途                                                                  |
| ------------ | --------------------------------------------------------------------- |
| `Button`     | variant: primary / secondary / outline / ghost / destructive          |
| `Card` 一式  | `CardHeader` `CardTitle` `CardDescription` `CardContent` `CardFooter` |
| `Spinner`    | 読み込み中。`role="status"` とスクリーンリーダー用ラベル付き          |
| `EmptyState` | 0件表示。アイコン・説明・アクションを差し込める                       |
| `cn()`       | Tailwind のクラス衝突を解決して結合（clsx + tailwind-merge）          |

## @fesp/ui と apps/admin/components/ui の使い分け

- **@fesp/ui** … 来場者向けアプリ・LP・管理画面のどこでも使う汎用部品
- **apps/admin/components/ui** … shadcn/ui で生成した管理画面専用の部品（CLIで追加・更新するためアプリ内に置く）

管理画面でしか使わないものを、ここに無理に上げないこと。

## 追加するとき

1. `src/components/` に1ファイル1コンポーネントで追加
2. `src/index.ts` から re-export
3. テストを書く（`src/components/*.test.tsx`）

色は必ずセマンティックトークン（`bg-primary` `text-muted-foreground` など）を使う。
生の色を直接書くとダークテーマで破綻する。

## テスト

```bash
bun run test    # Vitest + React Testing Library
```
