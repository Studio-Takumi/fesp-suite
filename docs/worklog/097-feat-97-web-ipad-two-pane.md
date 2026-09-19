---
title: ウェブアプリの一覧+個別を iPad で2ペインにする
issue: 97
branch: 'feat/#97-web-ipad-two-pane'
date: 2026-09-19
---

# 097 feat: #97 ウェブアプリの一覧+個別を iPad で2ペインにする

## やったこと

お知らせ・ブログ・模擬店・出演者の個別ページのルートを一覧ページの子にし、幅が768px以上のときは
左に一覧・右に個別を並べて出すようにした。一覧のカードは `<Link>` にしたので、押しても左のペインは
読み直さない。

## 変更したファイル

| ファイル                                            | 変更内容                                                                 |
| --------------------------------------------------- | ------------------------------------------------------------------------ |
| `apps/web/src/lib/use-media-query.ts`               | 追加。`matchMedia` を `useSyncExternalStore` で購読するフック            |
| `apps/web/src/components/list/ListDetailPanes.tsx`  | 追加。2ペインの枠と、幅・子ルートの有無による出し分け                    |
| `apps/web/src/components/article/ArticleBySlug.tsx` | 追加。slug で記事を引いて本文を出す（`SlugPage` から切り出し）           |
| `apps/web/src/router.tsx`                           | `/news` `/blog` `/shop` `/artist` を親ルートにし、個別をその子にした     |
| `apps/web/src/components/AppShell.tsx`              | `md` 以上で幅を `max-w-6xl` に広げ、スクロールを `main` に移した         |
| `apps/web/src/components/BottomNav.tsx`             | 中身の幅を `md:max-w-6xl` に合わせた                                     |
| `apps/web/src/pages/SlugPage.tsx` / `HomePage.tsx`  | `ArticleBySlug` を使う形にした                                           |
| `apps/web/src/components/news/NewsRow.tsx` ほか3件  | `<a>` → `<Link>`。`activeProps` で選択中の背景（`rounded-xl bg-sky-50`） |
| `apps/web/src/test/media.ts`                        | 追加。jsdom に無い `matchMedia` の差し替えと、幅の切り替え               |
| `apps/web/src/test/render.tsx`                      | `renderInRouter` を追加（Router の中でコンポーネントを描画する）         |
| `docs/app.md`                                       | 本文の幅・スクロールと、2ペインの仕様を追記                              |

## 実装メモ

- **左右の出し分けは CSS ではなく `matchMedia` でやった。** 一覧と個別はどちらを出すかが幅で変わり、
  CSS で隠すだけだと幅が足りないときにも個別のデータを読みに行ってしまう
- **2ペインの判定は `useChildMatches()`。** 個別のルート（`/news/$postId`）が当たっているかを見る。
  パスの文字列を持たなくて済むので、4種類とも同じコンポーネントで済む
- **一覧のパスを開いたときの右のペインは、仮の個別ページをそのまま出している。**
  種類ごとのデータ（#56〜#60）が入ったら、一覧の先頭の id を渡す形になる
- **`md` 以上ではスクロールの持ち主を document から `main` に移した。** 左右を独立してスクロール
  させるには2ペインが画面の高さに収まっている必要がある。`h-[calc(100dvh-84px)]` のような任意値を
  書かずに済ませるため、`AppShell` の側で高さを決めた
- **選択中の行は背景色だけにした。** デザインではパディング（12/10）も付いているが、同じカードが
  iPhone の一覧やホームの一覧でも使われるので、そちらの間隔を変えないよう背景と角丸だけにしている
- **`<Link>` にしたのは一覧のカード4つだけ。** 記事のブロックの中の他のリンクは `<a>` のまま

## テスト

| テスト                                                     | 検証内容                                                            |
| ---------------------------------------------------------- | ------------------------------------------------------------------- |
| `apps/web/src/components/list/ListDetailPanes.test.tsx`    | 幅×子ルートの有無の4パターン、選択中の背景、行を押したときの移動    |
| `apps/web/src/components/article/ArticleRenderer.test.tsx` | 既存の68件。`<Link>` を描画できるよう Router の中で描画する形にした |

`<Link>` は Router の外では描画できないので、`renderInRouter` を足した。最初は `RouterProvider` で
包んだが、最初の読み込みが非同期で同期に書かれた既存のテストが軒並み落ちたため、`RouterContextProvider`
で ui をそのまま描画する形にしている。

iPad（1194×834）と iPhone（390×844）で実際の画面も確認した。

```
bun run format   ✅
bun run lint     ✅
bun run typecheck ✅
bun run test     ✅
bun run build    ✅
bun run e2e      ✅
```

## 詰まった点

- **一覧の行を探すテストが、個別のペインの「前後の記事」のリンクを拾っていた。** 行き先が同じ
  （`/news/news-8`）なので、`getAllByRole('link')` の先頭が一覧の行とは限らない。お知らせ一覧の
  `region` の中から探すようにした

## 残課題

- [ ] 記事の2カラム（ホーム・天気）（#67）
- [ ] マップの iPad 表示（#98）
- [ ] 個別記事のツールバー・アプリバー（共有・保存・印刷・戻る）。iPhone 側も未実装
- [ ] スケジュールの iPad 表示
