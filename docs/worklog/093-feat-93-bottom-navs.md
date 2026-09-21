---
title: 下のナビゲーションバーを管理者サイトから編集できるようにする
issue: 93
branch: 'feat/#93-bottom-navs'
date: 2026-09-22
---

# 093 feat: #93 下のナビゲーションバーを管理者サイトから編集できるようにする

## やったこと

ウェブアプリの下のナビの項目を、コードの定数から `bottom_navs` テーブルに移した。
一覧を返す API と、まとめて置き換える API を足し、管理者サイトに編集画面を作った。
文化祭ごとに出すページが違うので、実行委員が自分で足したり並べ替えたりできる。

## 変更したファイル

| ファイル                                                    | 変更内容                                                       |
| ----------------------------------------------------------- | -------------------------------------------------------------- |
| `supabase/migrations/20260920110000_create_bottom_navs.sql` | 追加。`bottom_navs` + RLS                                      |
| `packages/types/src/database.generated.ts`                  | 再生成                                                         |
| `packages/schema/src/bottom-nav.ts`                         | 追加。項目・一括置き換えのスキーマと上限（5件）                |
| `apps/api/src/routes/bottom-navs.ts`                        | 追加。`GET` と一括置き換えの `PUT`                             |
| `apps/api/src/index.ts`                                     | ルートを `app.route()` で束ねた                                |
| `apps/web/src/components/BottomNav.tsx`                     | API から引く。0件ならナビ自体を描画しない                      |
| `apps/web/src/components/nav-items.ts`                      | `navItems` の定数を削除。`isCurrentNavItem` は残し、変換を追加 |
| `apps/web/src/lib/queries.ts`                               | `bottomNavsQuery` を追加                                       |
| `apps/web/src/test/msw/handlers.ts`                         | 既定のハンドラに `/api/bottom-navs` を追加                     |
| `apps/admin/components/bottom-nav/BottomNavEditor.tsx`      | 追加。編集画面                                                 |
| `apps/admin/components/bottom-nav/IconPicker.tsx`           | 追加。lucide のアイコンを検索して選ぶ                          |
| `apps/admin/components/layout/admin-nav-items.ts`           | 下位項目（`children`）を追加                                   |
| `apps/admin/components/layout/AdminSidebar.tsx`             | 項目の描画を `NavRow` に切り出し、下位項目を字下げして出す     |
| `apps/admin/app/(dashboard)/settings/bottom-nav/page.tsx`   | 追加                                                           |
| `apps/admin/lib/queries.ts`                                 | `bottomNavsQuery` と `useSaveBottomNavs` を追加                |
| `apps/admin/package.json`                                   | `@dnd-kit/*` を追加（発注者の承認済み）                        |
| `docs/app.md` / `docs/admin.md`                             | 下のナビの記述を書き換え、編集画面の節を追記                   |

## 実装メモ

- **アイコンは lucide の全アイコンを許容した**（発注者の判断）。`packages/schema` は API（Workers）からも
  読むので lucide-react に依存させられない。**形（PascalCase の識別子）だけを検証し、実在するかは
  描画側で受け止める**。ウェブアプリは `lucide-react/dynamic` の `DynamicIcon` に `fallback` を渡して、
  知らない名前ならアイコンだけを出さずラベルと移動先はそのまま出す
    - `DynamicIcon` の `name` はケバブケース（`calendar-days`）で、DB は `docs/api.md` のとおり
      PascalCase（`CalendarDays`）。変換は `nav-items.ts` / `IconPicker.tsx` に置いた
    - `DynamicIcon` はアイコンを1つずつ動的に読み込むので、全アイコンをバンドルに入れずに済む

- **項目が0件のときは `<nav>` ごと出さない**（発注者の判断）。読み込み中・取得に失敗したときも同じ扱い。
  枠だけが出ても来場者には意味が無く、本文を画面の下まで使えたほうがよい

- **管理画面は「変更を保存」でまとめて送る。** API が一括置き換えなので、画面の中で控え（`draft`）を
  編集しておき、保存で1回だけ `PUT` する。開催日・場所・タグ（#107）が即保存なのと形が違うのは、
  API の形に合わせた結果

- **`PUT /api/bottom-navs` で「全部消すだけ」のときの権限を、残っているかどうかで判定している。**
  RLS では消せない行は消えないだけでエラーにならないので、`items` が空のときは消したあとに読み直して、
  まだ残っていれば 403 にする。空にする権限が無い人が 200 を受け取らないようにするため

- **管理画面の置き場は `/settings/bottom-nav` にした（私の判断）。** Issue にも指示にも無かったが、
  下のナビはサイト全体に関わる設定なので「基本設定」の下位項目にしている。
  親の `/settings` は準備中のままで、下位項目だけ開ける

- **サイドメニューの2階層化は #107 と同じ実装を入れている。** 並行して進めたので、
  `admin-nav-items.ts` と `AdminSidebar.tsx` は**マージのときに衝突する**。
  どちらか一方の `NavRow` を残し、`children` の定義だけを両方から拾えばよい

## テスト

| テスト                                                      | 検証内容                                                                          |
| ----------------------------------------------------------- | --------------------------------------------------------------------------------- |
| `apps/api/src/routes/bottom-navs.test.ts`                   | 認証・バリデーション（5件・10文字・`/` 始まり・アイコン名の形）・403 の2経路      |
| `apps/api/rls/bottom-navs.test.ts`                          | 他人のイベントの項目が見えない・消せない。visitor は作れない・消せない            |
| `apps/web/src/components/BottomNav.test.tsx`                | API から引いた順に出す・0件と失敗でナビを出さない・知らないアイコン名でも壊れない |
| `apps/admin/components/bottom-nav/BottomNavEditor.test.tsx` | 編集しただけでは送らない・保存で一括送信・上限・未入力や不正なパスで保存させない  |
| `apps/admin/components/layout/AdminSidebar.test.tsx`        | 下位項目がリンクとして字下げして出ること                                          |

```
bun run format   ✅
bun run lint     ✅
bun run typecheck ✅
bun run test     ✅
bun run build    ✅
bun run e2e      ✅
```

RLS テスト（`bun run --filter @fesp/api test:rls`）も fesp-dev に対して回して 106 件すべて通した。

## 詰まった点

- **並行ブランチが先に push したマイグレーションのせいで `supabase db push` が通らなかった。**
  fesp-dev には #107 の `20260920100000` が入っているのに、このブランチの `supabase/migrations/`
  には無いので「Remote migration versions not found in local migrations directory」で止まる。
  #107 の SQL を一時的に置いて push し、**コミット前に取り除いた**（DB には両方入っている）

- **`packages/types/src/database.generated.ts` には #107 のテーブルも入っている。**
  remote 全体から生成するため。マージ後に生成し直せば揃うので、そのままにしてある

- **`BottomNav` のテストが1件、ナビの同期描画に依存していた。** 「上のヘッダーは出さない」が
  `queryByRole('banner')` を見ていたが、API から引くようになってナビが後から出るぶん、
  記事の `pageHeader`（`<header>`）が先に描画されて引っかかるようになった。
  この `<header>` は `<main>` の中なので本来 banner ではない（testing-library が入れ子を見ていない）。
  **本文の外に `<header>` が無いこと**を見る形に書き換えた

- **RLS テストを通しで回すと、新しいファイルだけ collection に失敗することがあった。**
  共有の fesp-dev にテスト用のユーザー・イベントを作るので、並列に走ると取り合いになるのが原因。
  回し直すと通る（単体でも通る）。今回は通しで 106 件すべて通ったことを確認している

## 残課題

- [ ] `admin-nav-items.ts` / `AdminSidebar.tsx` の2階層化が #107 と衝突する。マージのときにどちらかへ寄せる
- [ ] 下のナビの見た目の変更（#91 のまま）
- [ ] 移動先を記事の slug から選ばせる形にするか（いまは自由入力）
