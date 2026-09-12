# @fesp/types — 共通型

zod から導出できない型と、Supabase 生成型の置き場。

## 使い方

```ts
import { ApiError, type Result, type RequestOptions } from "@fesp/types";

try {
  await apiFetch(...);
} catch (error) {
  if (error instanceof ApiError && error.isUnauthorized) {
    // ログイン画面へ
  }
}
```

## 中身

| ファイル      | 内容                                                                               |
| ------------- | ---------------------------------------------------------------------------------- |
| `api.ts`      | `ApiError`（HTTPステータス + APIのエラーコード）、`Result<T, E>`、`RequestOptions` |
| `database.ts` | Supabase 生成型の置き場（現状は最小のプレースホルダ）                              |

`ApiError` には `isUnauthorized` / `isForbidden` / `isNotFound` のヘルパーがある。
API側の `errorResponseSchema` と対になっていて、フロントの `lib/api.ts` がこれに変換する。

## Supabase の型を取り込む

プロジェクトを作ったら生成型に差し替える。

```bash
bunx supabase gen types typescript --project-id <ref> > packages/types/src/database.generated.ts
```

生成後、`database.ts` の中身を生成ファイルの re-export に置き換える。

## ここに置くもの / 置かないもの

- **置く** … 複数アプリで使う、バリデーションを伴わない型やエラークラス
- **置かない** … バリデーションが絡むものは全部 [`@fesp/schema`](../schema/README.md)。
  型だけ切り出すと二重管理になる
