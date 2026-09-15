# supabase

DB・認証（Supabase）まわりの置き場。テーブルの仕様は [`docs/db.md`](../docs/db.md)。

## 開発用プロジェクト（作成済み）

| 項目        | 値                                        |
| ----------- | ----------------------------------------- |
| 名前        | `fesp-dev`                                |
| project ref | `xkeiraezgwtwhhwwgvxn`                    |
| リージョン  | `ap-northeast-1`（東京）                  |
| JWT         | ES256（新規プロジェクトの既定。非対称鍵） |

以下の手順の `<ref>` はこの project ref に読み替える。実値は各アプリの
`.env` / `.dev.vars`（いずれも git 管理外）に反映済み。本番用プロジェクトは未作成。

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
- イベントへの所属は JWT に埋めず、**RLS で `auth.uid()` から `event_members` を引いて判定する**
  （`private.is_event_member` / `private.is_event_staff`。[`docs/db.md`](../docs/db.md)）
- API は原則ユーザーのJWTを引き継いだクライアントで読み書きし、RLS を効かせる
  （`apps/api/src/lib/supabase.ts` の `createUserClient`）
- `service_role` を使う場合は **Hono 側で認可を自前実装する**
- テストは「他人の行が見えない・触れない」を重点的に検証する

## RLS のテスト

`apps/api/rls/` にある。fesp-dev に一時的なユーザー・イベントを作り、ユーザーのトークンで PostgREST を叩いて確かめ、
終わったら消す。`apps/api/.dev.vars` の `SUPABASE_SERVICE_ROLE_KEY` を使うため CI では動かさない。
**マイグレーションで RLS を触ったら、`db push` のあとに手元で回す。**

```bash
bun run --filter @fesp/api test:rls
```
