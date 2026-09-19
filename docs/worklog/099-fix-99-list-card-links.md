---
title: 一覧のカードから個別ページに移動できない
issue: 99
branch: 'fix/#99-list-card-links'
date: 2026-09-19
---

# 099 fix: #99 一覧のカードから個別ページに移動できない

## やったこと

ブログ・模擬店・出演者の一覧のカードのリンク先を、ルート定義に合わせて単数形に直した。
一覧からそれぞれの個別ページに移動できるようになった。

## 変更したファイル

| ファイル                                                   | 変更内容                                                             |
| ---------------------------------------------------------- | -------------------------------------------------------------------- |
| `apps/web/src/components/blog/BlogCard.tsx`                | リンク先を `/blogs/:id` → `/blog/:id`                                |
| `apps/web/src/components/shop/ShopCard.tsx`                | リンク先を `/shops/:id` → `/shop/:id`                                |
| `apps/web/src/components/artist/ArtistCard.tsx`            | リンク先を `/artists/:id` → `/artist/:id`                            |
| `apps/web/src/components/article/blocks/RelatedPosts.tsx`  | リンク先を `/blogs/:id` → `/blog/:id`                                |
| `apps/web/src/components/article/ArticleRenderer.test.tsx` | 各ブロックのカードのリンク先の期待値を単数形に直した                 |
| `docs/app.md`                                              | ブログ一覧・関連する記事・模擬店一覧・出演者一覧の節の記述を単数形に |

## 実装メモ

- **単数形（ルート側）に寄せた。** 複数形に寄せる選択肢もあったが、#97 で個別ページのルートを
  一覧ページの子にするため、個別のパスは一覧のパス（`/blog`）の下にある必要がある
- **お知らせだけ元から合っていた**（`NewsRow` は `/news/:id`）。今回は触っていない
- **`docs/app.md` 自体が食い違っていた。** 「個別ページ」の節は単数形、各ブロックの節は複数形で
  書かれていたので、ブロックの節を単数形に直した。パラメータ名は周囲の記述に合わせて `:id` のまま

## テスト

| テスト                                                     | 検証内容                                 |
| ---------------------------------------------------------- | ---------------------------------------- |
| `apps/web/src/components/article/ArticleRenderer.test.tsx` | ブログ・模擬店・出演者のカードのリンク先 |

リンク先は既存のテストが検証していたので、新しいテストは足さず期待値を直した。
画面の導線を触ったため E2E も実行した（`bun run e2e` ✅）。

```
bun run format   ✅
bun run lint     ✅
bun run typecheck ✅
bun run test     ✅
bun run build    ✅
```

## 詰まった点

なし

## 残課題

- [ ] 一覧のカードを `<Link>` にして、ページ全体を読み直さずに移動できるようにする（#97）
