# @fesp/admin — 管理者サイト

ノーコードで編集する管理画面。
**Next.js 16（`use client` 主体）+ shadcn/ui + TanStack Table + TipTap/Yjs**。

> 現状は配線確認用のページのみ。編集機能は未実装。

## 立ち上げ方

```bash
cp .env.example .env     # 初回だけ

bun run dev              # → http://localhost:3001
```

ルートからなら `bun run dev --filter @fesp/admin`。

同期編集まで動かすなら3つ起動する:

```bash
bun run dev --filter @fesp/api        # :8787  データの読み書き
bun run dev --filter @fesp/realtime   # :1999  同期編集
bun run dev --filter @fesp/admin      # :3001  この画面
```

```bash
bun run build && bun run start   # 本番ビルドの確認（:3001）
```

## 環境変数（`.env`）

| 変数                                                         | 用途                                  |
| ------------------------------------------------------------ | ------------------------------------- |
| `NEXT_PUBLIC_API_URL`                                        | Hono API のURL                        |
| `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase Auth                         |
| `NEXT_PUBLIC_PARTYKIT_HOST`                                  | PartyKit のホスト（同期編集の接続先） |

## ディレクトリ

```
app/
├─ layout.tsx / Providers.tsx   QueryClientProvider
└─ page.tsx                     配線確認用ページ（実装時に置き換える）
components/
├─ ui/                          shadcn/ui 相当のプリミティブ（button/input/label/table）
├─ example/
│  ├─ DataTable.tsx             TanStack Table の汎用テーブル（ソート・フィルタ）
│  └─ ExampleForm.tsx           React Hook Form + 共有zod のフォーム
└─ editor/
   ├─ CollaborativeEditor.tsx   TipTap + Collaboration + 保存ボタン
   └─ use-collaboration.ts      Yjs Doc と PartyKit プロバイダ
lib/    api.ts（APIクライアント）/ queries.ts / supabase.ts / env.ts / utils.ts
stores/ ui.ts（Zustand。UI状態のみ）
```

`components/example/` は書き方の見本。機能ごとのコンポーネントを作ったら消してよい。

### shadcn/ui のコンポーネントを足す

`components.json` を設定済みなので CLI がそのまま使える。

```bash
bunx shadcn@latest add dialog select
```

## フォームのバリデーション

`@fesp/schema` の zod スキーマを resolver にそのまま渡す。
API 側も同じスキーマで検証するので、「フロントは通ったのにAPIで弾かれる」ズレが起きない。

```ts
useForm<ExampleFormValues, unknown, ExampleInput>({
    resolver: zodResolver(exampleInputSchema),
})
```

`.default()` を持つスキーマは入力型(`z.input`)と出力型(`z.output`)が別物になるため、
`useForm` のジェネリクスを3つ指定している。

## 同期編集（TipTap + Yjs + PartyKit）

`CollaborativeEditor` に `roomId` とアクセストークンを渡すと PartyKit に接続する。
未認証は PartyKit 側で入室拒否。

二段構え:

- **ライブ編集** … TipTap ↔ Yjs ↔ PartyKit。マージ正しさは Yjs 任せ
- **確定保存** … 保存ボタン → API → Supabase（正本）。保存先のエンドポイントは実装時に作る

## テスト

```bash
bun run test    # RHF/zodのバリデーション + TanStack Table のソート/フィルタ
bun run e2e     # Playwright（同期編集のテンプレート。現状 skip）
```

`e2e/collaborative-editing.spec.ts` は2ブラウザコンテキストで反映を確認するテスト。
Supabase のテストユーザーと PartyKit のローカル起動が要るため `test.skip` にしてある。

## デプロイ

```bash
bun run preview   # OpenNext でビルドしてローカルプレビュー
bun run deploy    # Cloudflare Workers（OpenNext）へ
```
