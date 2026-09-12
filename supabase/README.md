# supabase

DB・認証（Supabase）まわりの置き場。**スキーマはまだ作っていない**（設計が固まってから追加する）。

## セットアップ手順

1. クラウドで **開発用プロジェクト** を作成（本番用とは分ける。ローカル起動は不要）
2. Authentication の設定
    - JWT を **非対称鍵（RS256 / ES256）** にする
    - JWKS エンドポイント（`https://<ref>.supabase.co/auth/v1/.well-known/jwks.json`）を控える
3. 各アプリの環境変数に値を入れる
    - `apps/api/.dev.vars` … `SUPABASE_URL` / `SUPABASE_ANON_KEY` / `SUPABASE_JWKS_URL` / `SUPABASE_JWT_ISSUER`
    - `apps/web/.env`, `apps/admin/.env` … `*_SUPABASE_URL` / `*_SUPABASE_ANON_KEY`
    - `apps/realtime/partykit.json` の `vars` … JWKS / issuer
4. スキーマを作ったらマイグレーションを `migrations/` に置いて適用する

```bash
bunx supabase link --project-ref <ref>
bunx supabase db push
```

5. 型を生成して `@fesp/types` に取り込む

```bash
bunx supabase gen types typescript --project-id <ref> > packages/types/src/database.generated.ts
```

## 設計するときの前提

- **RLS を有効にする前提で設計する**（テーブルを作ったら必ずポリシーも書く）
- 認可に使う情報（所属など）は **Auth Hook で JWT の `app_metadata` に埋める**。
  API（Hono）と PartyKit はこのクレームを見て判断する
- API は原則ユーザーのJWTを引き継いだクライアントで読み書きし、RLS を効かせる
  （`apps/api/src/lib/supabase.ts` の `createUserClient`）
- `service_role` を使う場合は **Hono 側で認可を自前実装する**
- テストは「他人の行が見えない・触れない」を重点的に検証する
