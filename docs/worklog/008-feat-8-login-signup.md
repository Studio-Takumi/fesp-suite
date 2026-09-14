---
title: ログインと新規登録を作る（管理者サイト / ウェブアプリ）
issue: 8
branch: 'feat/#8-login-signup'
date: 2026-09-15
---

# 008 feat: #8 ログインと新規登録を作る（管理者サイト / ウェブアプリ）

## やったこと

ウェブアプリと管理者サイトに、ログイン・新規登録の画面（Google とメールアドレス + パスワード）を作り、未ログインなら `/login?redirect=<元のパス>` に移動させるようにした。
ログアウトは、管理者サイトはサイドメニューの一番下、ウェブアプリは仮ページの `/settings` に置いた。
DB に `auth.users` と 1:1 の `users` テーブル（新規登録時にトリガーで1行作る）を作り、`GET /api/me` で自分の行を返す。

## 変更したファイル

| ファイル                                                                   | 変更内容                                                                                                            |
| -------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------- |
| `docs/design/ui-design.pen`                                                | ウェブアプリのログイン・新規登録（iPhone / iPad）と管理者サイトの新規登録を追加、キャンバスを並べ替え（別コミット） |
| `docs/db.md` / `docs/api.md` / `docs/app.md` / `docs/admin.md`             | `users`・`GET /api/me`・ログイン・新規登録・設定・ログインの確認の仕様（別コミット）                                |
| `supabase/migrations/20260915120000_create_users.sql`                      | 新規。`users` テーブル、`auth.users` への insert で行を作るトリガー、既存ユーザーの行、RLS                          |
| `packages/types/src/database.generated.ts`                                 | 再生成                                                                                                              |
| `packages/schema/src/auth.ts`                                              | `signUpSchema` と `redirectPathSchema`（サイト内のパスだけ通し、それ以外は `/`）を追加                              |
| `packages/schema/src/user.ts`                                              | 新規。`userResponseSchema`                                                                                          |
| `apps/api/src/routes/me.ts`                                                | 新規。`GET /api/me`。配線確認用に `index.ts` に直書きしていた実装を置き換えた                                       |
| `apps/web/src/router.tsx`                                                  | ログインが要るページを URL に出ない親ルート（`_authenticated`）の下にまとめ、`beforeLoad` で確認する                |
| `apps/web/src/components/auth/AuthForm.tsx`                                | 新規。ログイン・新規登録のフォーム                                                                                  |
| `apps/web/src/pages/LoginPage.tsx` / `SignupPage.tsx` / `SettingsPage.tsx` | 新規                                                                                                                |
| `apps/web/src/components/app-shell.tsx`                                    | ヘッダーの右に設定へのリンク                                                                                        |
| `apps/web/src/lib/supabase.ts`                                             | セッションの保存キーを `fesp-web-auth` に固定                                                                       |
| `apps/web/src/pages/ArticlePage.tsx`                                       | ルートの id が変わったので `useParams` の `from` を合わせた                                                         |
| `apps/web/package.json`                                                    | `react-hook-form` / `@hookform/resolvers` を追加（発注者と合意。管理者サイトと同じ版）                              |
| `apps/admin/components/auth/AuthGuard.tsx` / `session-context.ts`          | 新規。ログインの確認とセッションの受け渡し                                                                          |
| `apps/admin/components/auth/AuthForm.tsx` / `app/login` / `app/signup`     | 新規。ログイン・新規登録の画面                                                                                      |
| `apps/admin/app/(dashboard)/layout.tsx`                                    | `AuthGuard` で包む                                                                                                  |
| `apps/admin/components/layout/AdminSidebar.tsx`                            | ユーザー欄を固定の名前からメールアドレス + ログアウトボタンに変えた                                                 |

## 実装メモ

- **ログイン状態は常に保持する。** supabase-js の既定（localStorage）のまま。「保持しない」を選べるようにするには保存先の切り替えを自前で作る必要があるので、選択肢はデザインから消した（発注者と合意）
- **ログアウトは `signOut({ scope: 'local' })` にした。** 既定の `global` だと、ウェブアプリでログアウトしたときに他の端末や管理者サイトのログインまで切れるため
- **`redirect` は `redirectPathSchema` で確かめてから使う。** `/` で始まり、`//` や `/\` で始まらないものだけ通す。外部 URL に飛ばされるのを防ぐため。Google ログインの戻り先（`redirectTo`）も同じ値にしている
- **ウェブアプリのログインの確認はルーターの `beforeLoad`（`getSession`）。** 未ログインなら `redirect({ to: '/login', search: { redirect: location.href } })`。ログイン・新規登録はログイン済みで開くと `redirect` 先へ移動する
- **管理者サイトの `AuthGuard` は `onAuthStateChange` だけで判定する。** 購読直後に `INITIAL_SESSION` が届くので、最初の確認とログアウト（`SIGNED_OUT`）の検知を1か所で済ませられる。ログアウト時のキャッシュ破棄と `/login` への移動もここで行い、サイドメニューは `signOut` を呼ぶだけにした
- **ログイン済みのメールアドレスは `SessionContext` で渡す。** サイドメニューが自分で `getSession` しなくて済むように、`AuthGuard` が持っているセッションをそのまま使う
- **フォームはアプリごとに作った。** ルーター（TanStack Router / Next.js）の API が違うため共通化はしなかった。文言・エラーの対応表は同じ
- **エラーコードは `invalid_credentials` と `user_already_exists` / `email_exists` だけ文言を分けた。** それ以外は「時間をおいて再度お試しください」
- **`GET /api/me` は `createUserClient`（ユーザーの JWT）で読む。** RLS で自分の行しか見えないので、`service_role` で読むより安全。`deleted_at` があれば `404`
- **E2E からログイン済みにするため、ウェブアプリの保存キーを固定した。** 既定のキーは Supabase の URL から作られ、ローカルと CI で変わってしまうため
- **メール確認はしない（#37 まで）。** Supabase の Confirm email はオフにしてある
- 発注者が行った設定: Google Cloud の OAuth クライアント作成、Supabase の Google プロバイダ有効化、Redirect URLs に `http://localhost:5173/**` / `http://localhost:3001/**` を追加、Confirm email をオフ

## テスト

| テスト                                                          | 検証内容                                                                                                                                     |
| --------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| `packages/schema/src/auth.test.ts`                              | `signUpSchema` のエラーメッセージ、`redirectPathSchema` がサイト内のパスだけ通し、`//evil.example` などを `/` にする                         |
| `apps/api/src/routes/me.test.ts`                                | 自分の行を返す、ユーザーのトークンで `users` を `id` と `deleted_at is null` で絞る、行なしで `404`、トークンなしで `401`、DB エラーで `500` |
| `apps/web/src/router.test.tsx`                                  | 未ログインで `/login?redirect=` に移動、ログイン済みでログイン・新規登録を開くと `redirect` 先へ、不正な `redirect` は `/`                   |
| `apps/web/src/pages/LoginPage.test.tsx` / `SignupPage.test.tsx` | 入力チェック、成功で `redirect` 先へ、エラーの文言、Google の戻り先、パスワードの表示切り替え、リンクが `redirect` を引き継ぐ                |
| `apps/web/src/pages/SettingsPage.test.tsx`                      | ログアウトで `scope: 'local'`、キャッシュを消して `/login` へ                                                                                |
| `apps/admin/components/auth/AuthForm.test.tsx`                  | ウェブアプリと同じ観点 + ログイン済みで開いたら移動                                                                                          |
| `apps/admin/components/auth/AuthGuard.test.tsx`                 | 確認中は何も出さない、ログイン済みで中身とセッション、未ログインで元のパスつきで移動、ログアウトでキャッシュ破棄と移動、購読の解除           |
| `apps/admin/components/layout/AdminSidebar.test.tsx`            | メールアドレスと頭文字、ログアウトボタン、閉じているときの表示                                                                               |
| `apps/web/e2e/auth.spec.ts`                                     | 未ログインで記事を開く → ログイン → 元の記事に戻る（Supabase Auth と API はスタブ）                                                          |
| `apps/web/e2e/smoke.spec.ts` / `article.spec.ts`                | ログイン済みのセッションを入れてから開くように変更                                                                                           |

```
bun run format    ✅
bun run lint      ✅
bun run typecheck ✅
bun run test      ✅
bun run build     ✅
bun run e2e       web の chromium ✅ / mobile-safari ✅（WebKit をローカルに入れた）
```

### RLS の確認（fesp-dev）

一時ユーザーを2人（A・B）作り、A のトークンで PostgREST を叩いて確認した。確認後に2人とも削除し、`users` の行も消えた（`on delete cascade`）。

| 観点                                     | 結果              |
| ---------------------------------------- | ----------------- |
| A で全件 select                          | A の行だけ        |
| A で B の行を select                     | 0件               |
| 未ログイン（anon）で select              | 0件               |
| A で insert                              | `403`             |
| A で自分の行を update / delete           | 0件（変わらない） |
| ユーザー作成時にトリガーで行ができている | A・B とも行あり   |

## 詰まった点

- **Pencil で新しく Insert したフレームの中身がスクリーンショットに出なかった。** データは正しいのに描画だけ空だった。同じフレームを Copy すると正しく描画されたので、Copy したものを残して元を消した
- **Pencil で編集した内容がファイルに書き出されておらず、コミットできなかった。** Pencil 側で保存してから（発注者）コミットした

## 残課題

- [ ] 新規登録のメール確認を有効にする（#37）
- [ ] ウェブアプリで URL からイベントを見分ける（#38）
- [ ] 本番の URL を Google Cloud の OAuth クライアントと Supabase の Redirect URLs に登録する（本番環境を作るとき。発注者が行う）
- [ ] `/settings` を本来の設定ページにし、ログアウトの置き場所をデザインに合わせる
- [ ] `users` の RLS の自動テスト（#35）
