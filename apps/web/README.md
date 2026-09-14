# @fesp/web — ウェブアプリ（来場者向けポータル）

**Vite + React の SPA**（軽快さ最優先。将来のネイティブ化も見据えた構成）。

> 現状は配線確認用のトップページのみ。画面・機能は未実装。

## 立ち上げ方

```bash
cp .env.example .env     # 初回だけ

bun run dev              # → http://localhost:5173
```

ルートからなら `bun run dev --filter @fesp/web`。
トップページが API を叩くので、別ターミナルで `bun run dev --filter @fesp/api` も起動しておく
（起動していなければエラー表示になるだけで、画面自体は動く）。

```bash
bun run build     # 本番ビルド（dist/）
bun run preview   # ビルド結果をローカル配信
```

## 環境変数（`.env`）

| 変数                                           | 用途                          |
| ---------------------------------------------- | ----------------------------- |
| `VITE_API_URL`                                 | Hono API のURL                |
| `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY` | Supabase Auth                 |
| `VITE_PARTYKIT_HOST`                           | PartyKit のホスト（使う場合） |
| `VITE_EVENT_ID`                                | 表示するイベントの ID         |

`src/lib/env.ts` が起動時に zod で検証するので、設定漏れはすぐ落ちて気付ける。

## ディレクトリ

```
src/
├─ router.tsx              ルート定義（URL状態の担当）
├─ main.tsx                エントリ（QueryClientProvider / RouterProvider）
├─ index.css               Tailwind プリセットの読み込み
├─ pages/
│  ├─ home.tsx             配線確認用のトップページ（実装時に置き換える）
│  └─ ArticlePage.tsx      記事ページ（/articles/:articleId）
├─ components/
│  ├─ app-shell.tsx        共通レイアウト
│  ├─ query-boundary.tsx   読み込み中 / エラー / 表示の分岐
│  └─ article/             記事本文のレンダラ（ArticleRenderer・レジストリ・ブロックごとの部品）
├─ lib/
│  ├─ queries.ts           TanStack Query の queryOptions（サーバー状態）
│  ├─ api.ts               fetch ラッパー。レスポンスを共有zodで検証
│  ├─ supabase.ts          Supabase クライアント
│  └─ env.ts               環境変数の検証
├─ stores/ui.ts            Zustand（クライアントUI状態のみ）
└─ test/                   MSW ハンドラ・描画ヘルパー
```

## 画面を足すとき

1. `src/pages/` にコンポーネントを作る
2. `src/router.tsx` に `createRoute` を足して `routeTree` に並べる
3. データ取得は `src/lib/queries.ts` に `queryOptions` を足す（`useQuery` に直接 fetch を書かない）

ルーティングは **TanStack Router のコード定義**。生成ファイル（`routeTree.gen.ts`）に依存しない構成。

## テスト

```bash
bun run test        # Vitest + RTL。APIは MSW でモック
bun run e2e         # Playwright（dev サーバーは自動起動）
bun run e2e:ui      # Playwright UIモード
```

初回だけ `bunx playwright install chromium` が必要。
E2E は `page.route()` でAPIをスタブするので、API を起動していなくても走る。

## デプロイ

```bash
bun run build
bun run deploy      # Cloudflare（静的配信 / SPAフォールバック）
```
