# fesp-suite

文化祭支援サービスのモノレポ（LP / ウェブアプリ / 管理者サイト / API / リアルタイム同期）。
技術選定・構成は [`../指示書-プロジェクト構築.md`](../指示書-プロジェクト構築.md) に準拠。

> **現状は環境構築のみ。** 各アプリには配線確認用のサンプル（`example` と名の付くもの）だけが入っている。
> 機能・DB設計は未着手。実装の進め方は [`docs/next-steps.md`](./docs/next-steps.md) を参照。

## 構成

```
fesp-suite/
├─ apps/
│  ├─ lp/         LPサイト        Next.js 16 + Framer Motion       :3000
│  ├─ web/        ウェブアプリ    Vite + React SPA                 :5173
│  ├─ admin/      管理者サイト    Next.js 16 + shadcn/ui + TipTap  :3001
│  ├─ api/        統合API         Hono on Cloudflare Workers       :8787
│  └─ realtime/   Yjs同期         PartyKit + y-partykit            :1999
├─ packages/
│  ├─ schema/     共有zodスキーマ（フロント + API の唯一の正本）
│  ├─ ui/         共通UIコンポーネント（Tailwind v4 + lucide-react）
│  ├─ config/     共通設定（tsconfig / tailwind preset / eslint）
│  └─ types/      共通型（ApiError / Supabase生成型の置き場）
├─ supabase/      DB・認証のセットアップ手順（スキーマは未作成）
└─ docs/          アーキテクチャ・次にやること
```

各ワークスペースの詳しい立ち上げ方は、それぞれの README を参照。

| ワークスペース   | 説明                       | README                                         |
| ---------------- | -------------------------- | ---------------------------------------------- |
| `@fesp/lp`       | LPサイト                   | [apps/lp](./apps/lp/README.md)                 |
| `@fesp/web`      | ウェブアプリ（来場者向け） | [apps/web](./apps/web/README.md)               |
| `@fesp/admin`    | 管理者サイト               | [apps/admin](./apps/admin/README.md)           |
| `@fesp/api`      | 統合API                    | [apps/api](./apps/api/README.md)               |
| `@fesp/realtime` | Yjs同期サーバー            | [apps/realtime](./apps/realtime/README.md)     |
| `@fesp/schema`   | 共有zodスキーマ            | [packages/schema](./packages/schema/README.md) |
| `@fesp/ui`       | 共通UI                     | [packages/ui](./packages/ui/README.md)         |
| `@fesp/config`   | 共通設定                   | [packages/config](./packages/config/README.md) |
| `@fesp/types`    | 共通型                     | [packages/types](./packages/types/README.md)   |

## セットアップ

```bash
# 1. 依存インストール（Bun 1.4 以上）
bun install

# 2. 環境変数を用意
cp .env.example .env                       # 参照用のまとめ
cp apps/api/.dev.vars.example apps/api/.dev.vars
cp apps/web/.env.example apps/web/.env
cp apps/admin/.env.example apps/admin/.env
cp apps/lp/.env.example apps/lp/.env

# 3. 全アプリを起動
bun run dev
```

Supabase を繋がなくても、各アプリの起動・ビルド・テストは通る。
DBが必要になったら [`supabase/README.md`](./supabase/README.md) の手順で用意する。

### 個別に起動する

`--filter` にワークスペース名を渡すと1つだけ起動できる。
フロントを単体で動かす場合、APIも一緒に起動しておくこと。

```bash
bun run dev --filter @fesp/api        # API        http://localhost:8787
bun run dev --filter @fesp/web        # ウェブアプリ http://localhost:5173
bun run dev --filter @fesp/admin      # 管理者サイト http://localhost:3001
bun run dev --filter @fesp/lp         # LP         http://localhost:3000
bun run dev --filter @fesp/realtime   # PartyKit   http://localhost:1999
```

各アプリのディレクトリに入って `bun run dev` でも同じ。

## よく使うコマンド

| コマンド            | 内容                               |
| ------------------- | ---------------------------------- |
| `bun run dev`       | 全アプリを並行起動                 |
| `bun run build`     | 差分ビルド（Turborepo キャッシュ） |
| `bun run test`      | Vitest（全ワークスペース）         |
| `bun run typecheck` | tsc --noEmit（全ワークスペース）   |
| `bun run lint`      | ESLint（全ワークスペース）         |
| `bun run e2e`       | Playwright（lp / web / admin）     |
| `bun run format`    | Prettier                           |

## 状態管理の担当（混ぜないこと）

| 状態                  | 担当                          |
| --------------------- | ----------------------------- |
| サーバー状態（pull）  | TanStack Query                |
| 同期状態（push/協調） | Yjs                           |
| クライアントUI状態    | Zustand                       |
| URL状態               | TanStack Router / Next Router |
| フォーム状態          | React Hook Form + zod         |

詳細は [`docs/architecture.md`](./docs/architecture.md)。

## 共有スキーマ（packages/schema）

バリデーションは `@fesp/schema` に一度だけ定義し、フロント（RHF の resolver）と
API（`zValidator`）の両方から import する。二重定義があると「フロントは通ったのに
API で弾かれる」型ズレが起きるため、追加するときは必ずこのパッケージから。

```ts
// フロント
useForm({ resolver: zodResolver(exampleInputSchema) })
// API
app.post('/example', zValidator('json', exampleInputSchema, validationHook), handler)
```

## デプロイ

| 対象         | 先                             | コマンド                                             |
| ------------ | ------------------------------ | ---------------------------------------------------- |
| API          | Cloudflare Workers             | `bun run deploy --filter @fesp/api`                  |
| リアルタイム | Cloudflare（PartyKit）         | `bun run deploy --filter @fesp/realtime`             |
| LP / 管理者  | Cloudflare Workers（OpenNext） | `bun run deploy --filter @fesp/lp`                   |
| ウェブアプリ | Cloudflare（静的配信）         | `bun run build && bun run deploy --filter @fesp/web` |

CI（GitHub Actions）は Linux ランナーで `bun install` → `turbo run lint typecheck test build`。

## 技術選定の補足（雛形で確定させた点）

- **TypeScript は 5.9 系**。7.0 が出ているが typescript-eslint がまだ非対応（`<6.1.0`）
- **TanStack Table は v8**。v9 は `useTable` + プラグイン構成へのAPI刷新で移行コストが高い
- **TanStack Router はコード定義ルーティング**（`apps/web/src/router.tsx`）。生成ファイル
  （`routeTree.gen.ts`）への依存を避けている。ファイルベースにしたくなったら
  `@tanstack/router-plugin` を追加する
- **ESLint は共有フラット設定**。`next lint` は Next 16 で廃止されたため、
  Next アプリも `eslint .` で共通設定を使う
