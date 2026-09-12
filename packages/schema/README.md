# @fesp/schema — 共有zodスキーマ

**フロント（React Hook Form）と API（Hono）が共有する、バリデーションの唯一の正本。**

同じ検証を2か所に書くと「フロントは通ったのにAPIで弾かれる」ズレが起きる。
バリデーションが必要になったら、まずここに追加してから両側で import する。

## 使い方

ビルド不要（TypeScriptのソースをそのまま配布している）。import するだけ。

```ts
// フロント
import { exampleInputSchema } from "@fesp/schema";
useForm({ resolver: zodResolver(exampleInputSchema) });

// API
import { exampleInputSchema } from "@fesp/schema";
app.post("/example", zValidator("json", exampleInputSchema, validationHook), handler);
```

## 中身（現状）

| ファイル     | 内容                                                                 |
| ------------ | -------------------------------------------------------------------- |
| `common.ts`  | uuid / timestamp / date / URL / ページング / **APIの共通エラー形式** |
| `auth.ts`    | Supabase の JWTクレーム、ハンドラで使う AuthUser、ログインフォーム   |
| `example.ts` | 配線確認用のサンプル（実装が始まったら削除してよい）                 |

ドメインのスキーマはまだ無い。仕様が固まったら機能ごとにファイルを足す。

## 命名の約束（ドメインを足すとき）

| 用途                     | 命名               | 例                      |
| ------------------------ | ------------------ | ----------------------- |
| 一覧で返す形             | `〜SummarySchema`  | `xxxSummarySchema`      |
| 詳細で返す形             | `〜DetailSchema`   | `xxxDetailSchema`       |
| 作成・更新フォームの入力 | `〜InputSchema`    | `xxxInputSchema`        |
| APIレスポンス全体        | `〜ResponseSchema` | `xxxListResponseSchema` |

エラーメッセージは**日本語で、そのまま画面に出せる文言**にする（フォームがそのまま表示するため）。

## 注意（zod v4）

- `z.record(enum, ...)` は **全キーが必須**。部分的に許したいときは `z.partialRecord`
- `.default()` を付けると入力型と出力型が変わる。RHF 側は `useForm<z.input<S>, unknown, z.output<S>>` と書く
- 文字列フォーマットは `z.uuid()` / `z.url()` / `z.iso.datetime()` のトップレベル関数を使う

## テスト

```bash
bun run test
```

パース成功だけでなく、**既定値が埋まること・エラーメッセージの文言・弾くべき入力**を検証する。
