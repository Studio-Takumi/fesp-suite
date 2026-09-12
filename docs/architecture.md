# アーキテクチャ

```
┌─ LP (Next.js)        ─┐
├─ Web (Vite+React)    ─┤──▶  Hono API (Cloudflare Workers) ──▶ Supabase (Postgres)
└─ Admin (Next.js)     ─┘            │                                 ▲
                                     └──▶ PartyKit (Yjs同期) ──────────┘
                                            （スナップショットをSupabaseへ確定保存）
```

- 通常のCRUDは **Hono API 1本**。3フロントとも同じAPIを叩き、型は `@fesp/schema` で揃える
- **同期編集だけ PartyKit + Yjs に分離**。Supabase Realtime は行単位 pub/sub 向けで
  CRDT 同期には不向きなため、CRDT は Yjs に任せる

## 記事システム

ウェブアプリの画面は、**すべて「記事」1件として管理する**。画面ごとにページを実装するのではなく、
記事の中身（テキスト + 独自コンポーネント）が画面の違いを作る。仕組みは
[`article-system.md`](./article-system.md) を参照。

## 状態管理の担当（混ぜないこと）

| 状態                  | 担当                          | 置き場所                        |
| --------------------- | ----------------------------- | ------------------------------- |
| サーバー状態（pull）  | TanStack Query                | `lib/queries.ts`                |
| 同期状態（push/協調） | Yjs                           | `apps/admin/components/editor/` |
| クライアントUI状態    | Zustand                       | `stores/ui.ts`                  |
| URL状態               | TanStack Router / Next Router | `router.tsx` / `app/`           |
| フォーム状態          | React Hook Form + zod         | `components/**/*-form.tsx`      |

**サーバー状態を Zustand に入れないこと。**

## 認証（Supabase Auth / JWT）

発行は Supabase に任せ、**検証を自分（Hono / PartyKit）で行う**。

1. フロントで `supabase.auth.signInWith*()`。JWT の保存・自動リフレッシュは supabase-js が担当（自前実装しない）
2. API 呼び出し時に `Authorization: Bearer <access_token>` を付与（`lib/api.ts`）
3. Hono / PartyKit は **JWKS（RS256 / ES256）** で検証（`jose`）。秘密鍵を共有しないためエッジで安全
    - Hono: `apps/api/src/middleware/auth.ts` → `c.set("user", ...)`
    - PartyKit: `apps/realtime/src/server.ts` の `onBeforeConnect` で入室拒否
4. DBアクセスは原則 **ユーザーのJWTを引き継いだ Supabase クライアント**（`createUserClient`）で RLS を効かせる。
   `service_role` が必要な操作は Hono 側で認可を自前実装すること

認可に使う独自クレーム（所属など）は Auth Hook で `app_metadata` に埋める方針。
スキーマが決まったら `jwtClaimsSchema`（`packages/schema/src/auth.ts`）に項目を足す。

## リアルタイム同期（TipTap + Yjs + PartyKit）

- ドキュメント1つ = 1 room = 1 Durable Object
- サーバーの役割は「中継 / 保存 / 認証」のみ。CRDTのマージ正しさは Yjs が保証するので自前実装しない
- 二段構え:
    - **ライブ編集** = Yjs on PartyKit（Durable Object のストレージにスナップショット保持）
    - **確定データ** = Hono → Supabase（正本・検索対象）

ルームIDの規則と、誰がどの部屋に入れるかの判定（`canJoinRoom`）は、
ドメインが決まってから詰める。現状は「検証済みトークンがあれば入れる」だけ。

## APIのエラーフォーマット

すべてのエラーは `errorResponseSchema` に揃える。

```json
{
    "error": {
        "code": "bad_request",
        "message": "入力値が不正です",
        "details": { "name": ["名前は必須です"] }
    }
}
```

- 投げ方: `apps/api/src/lib/errors.ts` の `badRequest` / `unauthorized` / `forbidden` / `notFound`
- zod のバリデーション失敗も `validationHook` で同じ形に変換される
- フロントは `ApiError`（`@fesp/types`）として受け取る

## ポート

| アプリ       | ポート |
| ------------ | ------ |
| LP           | 3000   |
| 管理者サイト | 3001   |
| ウェブアプリ | 5173   |
| API          | 8787   |
| PartyKit     | 1999   |
