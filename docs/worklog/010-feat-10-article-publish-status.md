---
title: 記事を公開・非公開にできるようにする
issue: 10
branch: 'feat/#10-article-publish-status'
date: 2026-09-15
---

# 010 feat: #10 記事を公開・非公開にできるようにする

## やったこと

記事に公開状態（`status`: `draft` / `published`）と、初めて公開した日時（`published_at`）を持たせた。下書きはイベントの `staff` だけが読め、それ以外のメンバーには公開済みの記事だけが返る（RLS）。
管理者サイトの記事一覧に公開状態の列を足し、記事エディタに「公開」のスイッチを置いて、「保存」でタイトル・本文と一緒に保存するようにした。下書き = 非公開として扱い、#9 はこの Issue にまとめた。

## 変更したファイル

| ファイル                                                             | 変更内容                                                                                                                                  |
| -------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| `docs/db.md` / `docs/api.md` / `docs/admin.md`                       | `status`・`published_at`・トリガー・RLS、記事オブジェクトと各エンドポイントの公開状態、一覧の列とエディタのスイッチ（別コミット）         |
| `supabase/migrations/20260915150000_add_status_to_articles.sql`      | 新規。enum `article_status`、2列の追加と既存記事の公開済み化、`published_at` を決めるトリガー、select ポリシーの置き換え                  |
| `packages/types/src/database.generated.ts`                           | 再生成                                                                                                                                    |
| `packages/schema/src/article.ts`                                     | `articleStatusSchema` を追加。記事オブジェクトに `status` / `published_at`、`PUT` のボディに `status`。作成のボディは `status` を持たない |
| `apps/api/src/routes/articles.ts`                                    | select の列に `status` / `published_at`。`PUT` で `status` も更新する                                                                     |
| `apps/admin/components/ui/switch.tsx`                                | 追加。shadcn/ui の Switch（`radix-ui` を依存に追加）                                                                                      |
| `apps/admin/components/articles/ArticleList.tsx`                     | 公開状態の列（「下書き」「公開中」）                                                                                                      |
| `apps/admin/components/articles/ArticleEditView.tsx`                 | 「保存」の左に「公開」のスイッチ。フォームの値として持ち、保存でまとめて `PUT`。切り替えたら「保存しました」を消す                        |
| `apps/admin/lib/queries.ts`                                          | 作成の入力の型を、公開状態を持たない形にした                                                                                              |
| `apps/admin/test/setup.ts`                                           | jsdom に無い `ResizeObserver` の最小限の polyfill                                                                                         |
| `apps/api/rls/support.ts`                                            | フィクスチャの記事を公開済み（`articleA` / `articleB`）と下書き（`draftA` / `draftB`）に分けた                                            |
| `apps/web/e2e/*.spec.ts` / `apps/web/src/pages/ArticlePage.test.tsx` | 記事のフィクスチャに `status` / `published_at` を足した                                                                                   |

## 実装メモ

- **管理者サイト用とウェブアプリ用でエンドポイントを分けず、RLS でロールごとに返す範囲を変えた。** 分けても visitor が管理者向けのエンドポイントを直接叩けるので、下書きを守る判定は結局 RLS に要る。API のコードはアプリを見分けない（発注者と合意）
- **select のポリシーは1本を2本に分けた。** `articles_select_staff`（`is_event_staff`）と `articles_select_member_published`（`status = 'published'` かつ `is_event_member`）。permissive なので OR で効く
- **`staff` がウェブアプリで下書きを開けてしまうのは許容した。** 将来、これをそのまま下書きのプレビューに使える（プレビュー画面は作らない。発注者と合意）
- **`published_at` はトリガーで決める。** 更新前に値があれば元に戻し、無ければ `status` が `published` のときだけ `now()`、それ以外は `NULL`。渡された値は insert でも update でも使わないので、API のボディで受け取らない。`created_by` をトリガーで守っているのに揃えた
- **既存の記事は公開済みにした。** これまで全員に見えていたので、見え方を変えないため。`status` を既定値 `published` で追加してから既定値を `draft` に変え、`published_at` は `created_at` で埋めた。埋める update で `updated_at` が進まないよう、その間だけ `articles_set_updated_at` を止めた
- **`POST` は `status` を受け取らず、DB の既定値（下書き）で作る。** 作成のスキーマは `articleInputSchema.omit({ status: true })` から作る
- **`PUT` で `staff` でないメンバーが下書きを更新しようとすると 404 になる。** 更新できなかったあとの読み直しで、下書きが読めないため。下書きがあること自体を伝えないので、そのままにして仕様に追記した
- **エディタの公開状態は、タイトルと同じく react-hook-form の値として持つ。** スイッチは `Controller` でつなぐ。本文は従来どおり BlockNote の変更を state で持つ
- **スイッチのラベルは既存の `Label`（`htmlFor`）でつないだ。** テストは `getByRole('switch', { name: '公開' })` で引ける
- マイグレーションの適用（`db push`）は、発注者の許可を取ってから fesp-dev に実行した

## テスト

| テスト                                                    | 検証内容                                                                                                                                                                                               |
| --------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `packages/schema/src/article.test.ts`                     | `PUT` のボディの `status` は `draft` / `published` だけ受理し、無ければ拒否。作成のボディは `status` を取り除く。記事オブジェクトは `published_at: null` を受理し、`status` が無い・不正なら拒否       |
| `apps/api/src/routes/articles.test.ts`                    | 一覧・取得の列に `status` / `published_at`。`PUT` で `status` を更新、`status` が不正・無いと 400。`POST` のボディに `status` があっても insert に含めない                                             |
| `apps/api/rls/articles.test.ts`                           | 公開済みはメンバーなら読める、下書きは staff だけ（visitor として所属するイベントの下書きは読めない）。作成すると下書きで `published_at` は NULL、初回公開で入り以降は変わらない、直接書き換えられない |
| `apps/api/rls/users.test.ts`                              | 下書きの記事の作成者は、記事を通しては staff にしか見えない                                                                                                                                            |
| `apps/admin/components/articles/ArticleList.test.tsx`     | 「公開状態」の列に「下書き」「公開中」                                                                                                                                                                 |
| `apps/admin/components/articles/ArticleEditView.test.tsx` | スイッチの初期値が記事の公開状態、切り替えただけでは `PUT` しない、保存で `status` 込みで `PUT`、切り替えると「保存しました」を消す                                                                    |

```
bun run format    ✅
bun run lint      ✅
bun run typecheck ✅
bun run test      ✅
bun run build     ✅
bun run e2e       ✅（web 8 / lp 4。admin は既存の skip 1）
bun run --filter @fesp/api test:rls  ✅（41件、fesp-dev）
```

## 詰まった点

- **記事エディタのテストが全部「要素が見つからない」で落ちた。** Radix UI の Switch が `ResizeObserver` を使い、jsdom に無いので描画ごと落ちていた（画面は空の `<div />`）。`test/setup.ts` に最小限の polyfill を足した。Radix UI のコンポーネントを足したときは同じことが起こりうる
- **`shadcn add switch` が `import { cn } from "cn"` を生成した。** `components.json` の `utils` エイリアス（`~/lib/utils`）が反映されなかったので手で直した。次に shadcn で足すときも import を確認する
- **RLS テストの `users` の既存テストが落ちた。** テストで作る記事が既定値の下書きになり、visitor から記事ごと見えなくなっていた。記事を公開済みで作るようにした。記事を作るテストを足すときは `status` を意識する
- **コミット中に並行してファイルを読み書きすると、見つからないことがあった。** lint-staged がコミットの間、作業ツリーを退避しているため。コミットは他の操作と並行させない

## 残課題

- [ ] `staff` 以外が管理者サイトに入れないようにする（#44）
- [ ] 記事一覧の並べ替え・絞り込み（#45）
- [ ] 公開中の記事を裏で編集し、公開し直すまで前の版を出し続ける（#11）
- [ ] 予約投稿（#12）
- [ ] 下書きのプレビュー。`staff` はウェブアプリの記事ページで下書きを開けるので、それを使う案がある
- [ ] 既存の `button` / `input` / `label` は shadcn の見た目に合わせた自前実装で、Radix UI を使っていない。揃えるかは未定
- [ ] 本番用プロジェクトを作ったら、このマイグレーションを適用する
