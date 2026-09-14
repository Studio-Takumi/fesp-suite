# @fesp/api — 統合API

3フロント（LP / ウェブアプリ / 管理者サイト）共通のバックエンド。
**Hono on Cloudflare Workers**。DBは Supabase（Postgres）。

> エンドポイントの仕様は [`docs/api.md`](../../docs/api.md)。

## 立ち上げ方

```bash
# 初回だけ: ローカル用シークレットを作る
cp .dev.vars.example .dev.vars   # Supabase を使うなら実値に書き換える

bun run dev            # → http://localhost:8787（workerd 上で動く）
```

ルートからなら `bun run dev --filter @fesp/api`。

動作確認:

```bash
curl http://localhost:8787/health
# {"status":"ok","now":"..."}

curl http://localhost:8787/api/example
curl -X POST http://localhost:8787/api/example \
  -H "Content-Type: application/json" -d '{"name":"","email":"x"}'
# → 400。共通エラー形式でフィールド単位のメッセージが返る
```

Supabase 未接続でも上記は動く（DBを叩いていないため）。

## サンプルのエンドポイント

| メソッド | パス           | 何の確認用か                                    |
| -------- | -------------- | ----------------------------------------------- |
| GET      | `/health`      | 起動確認                                        |
| GET      | `/api/example` | クエリのバリデーション（既定値・範囲チェック）  |
| POST     | `/api/example` | 共有zodスキーマでのボディ検証                   |
| GET      | `/api/me`      | JWT検証（`Authorization: Bearer <token>` 必須） |

ドメインのルートは `src/routes/` に置き、`index.ts` から `app.route()` で束ねる。

## 環境変数（`.dev.vars`）

| 変数                                        | 用途                                                      |
| ------------------------------------------- | --------------------------------------------------------- |
| `SUPABASE_URL` / `SUPABASE_ANON_KEY`        | RLS 前提のDBアクセス                                      |
| `SUPABASE_SERVICE_ROLE_KEY`                 | RLSを貫通する一部操作のみ（**認可は自前で実装すること**） |
| `SUPABASE_JWKS_URL` / `SUPABASE_JWT_ISSUER` | JWT検証（JWKS / RS256・ES256）                            |

`ALLOWED_ORIGINS`（CORS）と R2 バインディングは `wrangler.jsonc` 側。
本番のシークレットは `bunx wrangler secret put <NAME>` で登録する。

## ディレクトリ

```
src/
├─ index.ts              ルーティング / CORS / エラーハンドラ
├─ types.ts              Bindings（env）と Variables（c.set する値）
├─ middleware/auth.ts    JWT検証 → c.set("user"|"accessToken")
├─ routes/               ドメインのルート（articles.ts など）
└─ lib/
   ├─ jwt.ts             jose + JWKS。鍵はグローバルにキャッシュ
   ├─ supabase.ts        user / anon / service_role の3クライアント
   ├─ errors.ts          共通エラーフォーマット
   └─ validator.ts       zValidator 用の共通フック
```

## テスト

```bash
bun run test         # vitest（app.request() でサーバー不要・高速）
bun run test:watch
```

`jose` は `vi.mock` で差し替えて JWT検証の分岐を検証している。
実 workerd 上での検証が必要になったら `@cloudflare/vitest-pool-workers` を追加する。

## デプロイ

```bash
bun run build        # wrangler deploy --dry-run（ビルド検証のみ）
bun run deploy       # Cloudflare Workers へデプロイ
bun run cf-typegen   # wrangler types（バインディングの型生成）
```

## 注意

- DBアクセスは原則 **ユーザーのJWTを引き継いだクライアント**（`createUserClient`）で RLS を効かせる
- `service_role` を使う場合は **Hono側で認可を自前実装**すること
- エラーは必ず `lib/errors.ts` のヘルパーで投げる（フロントが `ApiError` として受け取れる形に揃う）
