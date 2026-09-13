# CLAUDE.md

fesp-suite（文化祭支援サービス モノレポ）の開発フロー。**このファイルの手順を上から順に守ること。**

リポジトリの構成・コマンド・技術選定は [`README.md`](./README.md)、
設計の背景は [`docs/architecture.md`](./docs/architecture.md) を参照。

---

## 開発フロー

機能を1つ作るたびに、この 10 ステップを頭から回す。**途中を飛ばさない。**

### 1. Issue を立てる

1. まず Claude が叩き台を書く（ざっくりでよい。目的・やること・想定範囲）
2. 発注者（ユーザー）が設計を細かく決めて Issue を更新する
3. **過不足や設計の穴がないかを相談し、設計を確定させてから次へ進む**

テンプレートは [`.github/ISSUE_TEMPLATE/feature.md`](./.github/ISSUE_TEMPLATE/feature.md)。
Issue は発注者・Claude のどちらが立ててもよい。

### 2. Issue を読む

着手前に必ず該当 Issue を読む。**該当する Issue がなければ、まず Issue を立てる**（ステップ1へ戻る）。
Issue なしで実装を始めない。

**作業の途中で別の機能が必要だと判明したら、その場で Claude が Issue を立てる。**
今のブランチで一緒に実装しない。今の Issue の範囲だけを終わらせて、見つけたものは Issue に残す。

### 3. 疑問をつぶす（grill-me）

仕様・設計・既存実装について少しでも曖昧な点があれば、実装前に質問して潰す。
「たぶんこうだろう」で進めない。疑問がゼロになった状態で次へ。

### 4. 実装方針を提示する

コードを書き始める前に、以下を提示して合意を取る。

- **変更・追加するファイル**（パスを列挙）
- **どう実装するか**（方針・使うライブラリ・データの流れ）
- **追加するテスト**（何を、どのレイヤーで検証するか）
- **切る予定のブランチ名** — `feat/#1-hoge-fuga` の形式
  （`<type>/#<issue番号>-<英小文字ケバブの要約>`。type は `feat` / `fix` / `refactor` / `docs` / `chore`）

レビューで方針から差し戻されたときも、**このステップに戻ってやり直す**（ステップ10を参照）。

### 5. 仕様書を更新する

実装より先に仕様書を更新する。**書き方は既存の記述に合わせること**（見出しの粒度・表の形・語調）。

| ファイル                           | 書く内容                                   |
| ---------------------------------- | ------------------------------------------ |
| [`docs/api.md`](./docs/api.md)     | エンドポイントごとのリクエスト・レスポンス |
| [`docs/db.md`](./docs/db.md)       | テーブルごとのスキーマ                     |
| [`docs/lp.md`](./docs/lp.md)       | LPサイトのページごとの内容                 |
| [`docs/app.md`](./docs/app.md)     | ウェブアプリのページごとの内容             |
| [`docs/admin.md`](./docs/admin.md) | 管理者サイトのページごとの内容             |

該当しないファイルは触らない。

更新したら、**実装に入る前に一旦コミットする。** `main` を最新にしてからブランチを切ること
（古い `main` から生やさない）。

```bash
git switch main
git pull
git switch -c feat/#1-hoge-fuga
git add docs/
git commit -m "docs: #1 ほげほげふがふがの仕様を追加"
```

仕様と実装をコミットで分けておくと、レビューのとき「決めたこと」と「書いたコード」を
突き合わせて読める。

### 6. 実装する

- **既存実装をまねる。** 命名・ディレクトリ構成・エラーハンドリング・テストの書き方を周囲に揃える
  （レビューで出た命名ルールは [`docs/conventions.md`](./docs/conventions.md) にまとめてある）
- **デザインは `ui-design.pen` を参照する**（pencil MCP の `read_skill` / `get_style` / `execute` で読む。
  `.pen` は暗号化されているので Read / Grep で開かない）
- 状態管理の担当分けは [`README.md`](./README.md) の表に従う

**足す順番。** 下から積むと手戻りが少ない。

1. `packages/schema` … zodスキーマ（フロント・APIの共通の正本）。
   バリデーションはここに一度だけ定義し、フロントと API の両方から import する
2. `supabase/migrations` … テーブル + **RLSポリシー**（テーブルを作ったら必ずポリシーも書く）
3. `packages/types/src/database.generated.ts` … Supabase の型を再生成する
4. `apps/api/src/routes/` … ルートを作って `index.ts` から `app.route()` で束ねる
5. `apps/web/src/pages`, `apps/admin/app` … 画面。`lib/queries.ts` に queryOptions を足す

DBを触った回は、2 と 3 を飛ばさない。手順とコマンドは
[`supabase/README.md`](./supabase/README.md)。

**環境変数を足したときは、example も必ず更新する。** 消すときも同じ。

| 追加先               | 一緒に更新する example                              |
| -------------------- | --------------------------------------------------- |
| `apps/api/.dev.vars` | `apps/api/.dev.vars.example`                        |
| `apps/web/.env`      | `apps/web/.env.example`                             |
| `apps/admin/.env`    | `apps/admin/.env.example`                           |
| `apps/lp/.env`       | `apps/lp/.env.example`                              |
| いずれか             | ルートの `.env.example`（参照用のまとめ。常に追記） |

シークレット（値そのもの）は example に書かない。本番へは
`bunx wrangler secret put <NAME>` で登録し、必要なら作業ログに「登録が必要」と残す。

**依存パッケージの追加。** Issue 本文か指示に「このパッケージを入れる」と明示されていれば、
確認なしで入れてよい。**明示されていなければ、入れる前に確認を取る。**

### 7. format / lint / test / build を通す

```bash
bun run format
bun run lint
bun run typecheck
bun run test
bun run build
bun run e2e     # E2E を追加・変更した回、および画面の導線を触った回
```

**1つでも落ちたらそこでストップ。** 直してから次へ進む。落ちたまま先に進まない。
CI（[`.github/workflows/ci.yml`](./.github/workflows/ci.yml)）でも同じものが走る。
CI は `format:check` も見るので、`format` を忘れると PR が落ちる。

コミット時には husky + lint-staged で、**ステージしたファイルに `prettier --write` が自動でかかる**
（[`.husky/pre-commit`](./.husky/pre-commit) / [`.lintstagedrc.json`](./.lintstagedrc.json)）。
整形は自動だが ESLint・型・テストは走らないので、このステップは省略しない。

全部通ったら、**実装 + テストをコミットする。**

```bash
git add -A
git commit -m "feat: #1 ほげほげふがふが"
```

### 8. 作業ログを書く

[`docs/worklog/000-template.md`](./docs/worklog/000-template.md) をコピーして
`docs/worklog/001-feat-hoge-fuga.md` の形式で追加する。
**先頭の3桁は Issue 番号をゼロ埋めしたもの**（Issue #1 → `001`、Issue #12 → `012`）。
続きはブランチ名の `/` を `-` にしたもの。**書き方はテンプレート・既存のログに合わせること。**

書けたら、**作業ログだけを単独でコミットする。**

```bash
git add docs/worklog/
git commit -m "docs: #1 作業ログを追加"
```

### 9. push して PR を作成する

- push してから PR を作成し、Issue を紐付ける
- PR 本文は [`.github/pull_request_template.md`](./.github/pull_request_template.md) に従う
- コミットメッセージの形式は `<type>: #<issue番号> <日本語の要約>`

**コミットは意味の単位で分ける。** 仕様書 / 実装 + テスト / 作業ログ は必ず別コミットにする。
実装が大きいときは実装をさらに分けてよい。数を揃える必要はない。

### 10. マージ

**マージは発注者（ユーザー）が行う。** Claude はコードを読んでもらう状態にするところまで。
勝手にマージしない。

レビューで指摘が出たら、内容によって戻る先が変わる。

| 指摘の種類                       | 戻る先                                                 |
| -------------------------------- | ------------------------------------------------------ |
| 実装方針・設計そのものへの指摘   | **ステップ4に戻る**（方針を出し直して合意を取る）      |
| 実装の細部・バグ・書き方への指摘 | ステップ6から。修正コミットを積んでステップ7をやり直す |

方針から差し戻された場合、仕様書も直す必要があるならステップ5もやり直す。

---

## 判断に迷ったら確認を取ること

- **依存パッケージの追加** — Issue や指示に明示がなければ確認する
- **`README.md` / `docs/architecture.md` / `docs/next-steps.md` の変更** — ステップ5の対象外。
  構成や方針が変わって更新が必要だと判断したら、**その場で伝えて確認を取ってから直す**
- **仕様書に書かれていない挙動を決めるとき** — ステップ3に戻って質問する

## やらないこと

- Issue なしで実装を始める
- 今の Issue の範囲外のものを、ついでに実装する
- 仕様書を更新せずに実装だけ進める
- format / lint / test / build が落ちた状態で先に進む
- 作業ログを書かずに PR を作る
- 確認なしで依存パッケージを足す
- 自分でマージする
