# 次にやること

**環境構築のみ**が完了している状態。ドメイン（機能・DB設計）は未着手で、
各アプリには配線確認用のサンプルだけ置いてある。

## 1. Supabase プロジェクトの作成

[`../supabase/README.md`](../supabase/README.md) の手順。発注者側の作業が必要。

## 2. ドメイン設計を反映する

仕様が固まったら、この順で足していくと手戻りが少ない。

1. **`packages/schema`** … zodスキーマを定義（フロント・APIの共通の正本）
2. **`supabase/migrations`** … テーブル + RLS ポリシー
3. **`apps/api/src/routes/`** … ルートを作って `index.ts` から `app.route()` で束ねる
4. **`apps/web/src/pages`, `apps/admin/app`** … 画面。`lib/queries.ts` に queryOptions を足す

サンプル（`example` という名前のファイル・スキーマ・ルート）は、実装を始めたら削除してよい。

## 3. テストを足す（ROI順）

1. Hono API のユニット（`app.request()`。JWT検証・zod・認可）
2. 共有zod + React Hook Form のバリデーション
3. 各サイトの主要導線 E2E
4. RLS の統合テスト（他人の行が見えない・触れない）
5. 同期編集 E2E（Playwright で2ブラウザコンテキスト）

## 4. Cloudflare 側の準備

- R2 バケット作成（`fesp-assets-dev` / `fesp-assets-production`）
- `bunx wrangler secret put SUPABASE_SERVICE_ROLE_KEY` などシークレット登録
- PartyKit のデプロイ設定（`partykit.json` の vars を本番値へ）
- 独自ドメイン・OpenNext のキャッシュ設定

## 5. 未確定（発注者確認待ち）

- サービス名（LP のタイトル・OGP が仮置き）
- AI活用の機能仕様
- オフラインキャッシュの方式（Service Worker を入れるか、TanStack Query の永続化で足りるか）
