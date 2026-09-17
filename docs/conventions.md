# コーディング規約

レビューで指摘が出た命名・書き方のルールをここに集める。新しいファイルを作るときはここを確認する。
指摘が新しく出たら、直すのと合わせてこのファイルに追記する。

## ファイル名

| 対象                                            | 命名           | 例                                           |
| ----------------------------------------------- | -------------- | -------------------------------------------- |
| Reactコンポーネント（1コンポーネント1ファイル） | PascalCase.tsx | `AdminSidebar.tsx`                           |
| Hooks・ユーティリティ・データ定義の配列など     | kebab-case.ts  | `use-collaboration.ts`, `admin-nav-items.ts` |

コンポーネントのエクスポート名とファイル名を一致させる（`export function Foo` なら `Foo.tsx`）。

- **記事システムの独自コンポーネントブロック（`docs/article-system.md` 参照、#24）も同じ。**
  `shopList` のような表示名・ブロックタイプ名ではなく、PascalCaseの実装ファイル名にする
  （例: `ShopList.tsx`）
- 既存の `apps/admin/components/editor/` 配下（`collaborative-editor.tsx` など）はこのルール
  適用前に作られたもの。見つけたら直すが、直すこと自体を目的にした変更はしない
  （やっている作業のついでで直す）

## 日時の表示

日時を画面に出すときは `@fesp/ui` の `dateFormatter` を使う。`toLocaleString` や `Intl.DateTimeFormat` をその場で書かない
（書式とタイムゾーンを揃えるため。`dateFormatter` は閲覧端末の設定に関係なく日本時間で出す）。

```ts
import { dateFormatter } from '@fesp/ui'

dateFormatter(article.updated_at, 'YYYY/MM/DD HH:mm') // '2026/09/14 12:30'
dateFormatter(article.updated_at, 'MM/DD(EEE)') // '09/14(月)'
```

使えるトークンや曜日の出し方を足したいときは、`packages/ui/src/lib/date-formatter.ts` を直す。

## Tailwind

`text-[17px]` のような任意値（arbitrary value）は使わず、Tailwind のデフォルトスケール
（`text-base` など）に寄せる。デフォルトスケールで表現できない値がどうしても必要なときだけ、
理由をコメントで残した上で任意値を使う。

`p-3.5` のような `.5` 刻みの値も避け、`p-3` / `p-4` など整数の値を使う。

## アイコン

アイコンは lucide-react を使い、大きさは `size-4` などのクラスではなく `size` の props で数値を渡す。

```tsx
<Mail size={16} className='text-slate-400' />
```
