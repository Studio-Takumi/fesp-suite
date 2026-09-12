# @fesp/realtime — Yjs同期サーバー

管理者サイトの同期編集（TipTap の協調編集）を中継する **PartyKit + y-partykit**。
ドキュメント1つ = 1 room = 1 Durable Object。

## 立ち上げ方

```bash
bun run dev      # → http://localhost:1999
```

ルートからなら `bun run dev --filter @fesp/realtime`。

動作確認（ルームの状態を返すだけの疎通用エンドポイント）:

```bash
curl http://localhost:1999/parties/main/test
# {"room":"test","connections":0}
```

WebSocket 接続は **JWT必須**。`?token=<access_token>` を付けないと 401 で拒否される。
管理者サイト側は `components/editor/use-collaboration.ts` が自動で付与する。

## 環境変数（`partykit.json` の `vars`）

| 変数                  | 用途            |
| --------------------- | --------------- |
| `SUPABASE_JWKS_URL`   | JWT検証の公開鍵 |
| `SUPABASE_JWT_ISSUER` | issuer の検証   |

開発用 Supabase プロジェクトの値に書き換えてから使う。

## 役割の境界

このサーバーがやるのは **中継・保存・認証** だけ。

- CRDTのマージ正しさは Yjs が保証するので、競合解決を自前実装しない
- ライブ状態は Durable Object のストレージにスナップショット保持（`persist: { mode: "snapshot" }`）
- **正本の保存は別**。管理者サイトの「保存」から API（Hono）経由で Supabase に書き出す

## ファイル

```
src/
├─ server.ts     onBeforeConnect（認証・入室可否）/ onConnect（y-partykit）
└─ auth.ts       jose によるJWT検証、入室可否の判定
```

## 未実装（ドメイン確定後にやること）

- **ルームIDの規則**を決める（例: `<テナント>:<リソース>:<ID>`）
- `canJoinRoom()` の判定を実装する。現状は「検証済みトークンがあれば入れる」だけで、
  他人のドキュメントに入れてしまう
- 確定保存（スナップショット → Supabase）のエンドポイントを API 側に作る

## テスト

```bash
bun run test     # トークン抽出・入室可否ロジック
```

同期そのものは管理者サイトの Playwright E2E（2ブラウザコンテキスト）で確認する。

## デプロイ

```bash
bun run deploy   # Cloudflare（Workers / Durable Objects）へ
```

初回は PartyKit の CLI ログインが必要。
