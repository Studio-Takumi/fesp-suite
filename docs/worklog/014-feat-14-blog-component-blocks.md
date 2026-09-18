---
title: ブログ（Blog）の独自コンポーネントを作る
issue: 14
branch: 'feat/#14-blog-component-blocks'
date: 2026-09-18
---

# 014 feat: #14 ブログ（Blog）の独自コンポーネントを作る

## やったこと

ブログ一覧 `blogList`・関連する記事 `relatedPosts` の2つの独自コンポーネントを、schema・ウェブアプリのレジストリ・管理者サイトのブロック定義の3点セットで追加した。
表示するデータは API ができるまで仮データを `lib/queries.ts` の queryOptions から返す。個別ページの画像・サマリーは #13 の `coverImage` / `postSummary` をそのまま使い、新しく作っていない。

## 変更したファイル

| ファイル                                                        | 変更内容                                                                              |
| --------------------------------------------------------------- | ------------------------------------------------------------------------------------- |
| `docs/app.md`                                                   | 本文の描画の表に2ブロック、ブロックごとの節を追記（別コミット）                       |
| `docs/admin.md`                                                 | コンポーネントの表に2ブロック、ブロックごとの節を追記（別コミット）                   |
| `packages/schema/src/article.ts`                                | `blogListPropsSchema`・`parseBlogListTags` を追加し、記事ドキュメントのブロックに足す |
| `apps/web/src/components/article/blocks/BlogList.tsx`           | 追加。タグのタブ（絞り込み）・ブログのカード・0件なら空状態                           |
| `apps/web/src/components/article/blocks/RelatedPosts.tsx`       | 追加。関連する記事のサムネ・タイトル・日付                                            |
| `apps/web/src/components/blog/BlogCard.tsx`                     | 追加。ブログ一覧の1枚（デザインの BlogCard）                                          |
| `apps/web/src/components/article/block-registry.ts`             | 2ブロックを登録                                                                       |
| `apps/web/src/lib/mock/blog.ts` / `apps/web/src/lib/queries.ts` | 追加。ブログ・タグ・関連する記事の仮データと queryOptions                             |
| `apps/admin/components/editor/blocks/BlogListBlock.tsx`         | 追加。カードには設定の要約だけを出す                                                  |
| `apps/admin/components/editor/blocks/RelatedPostsBlock.tsx`     | 追加。カードには説明の一文だけを出す                                                  |
| `apps/admin/components/editor/BlogListPropsForm.tsx`            | 追加。props のフォーム（React Hook Form + zod）                                       |
| `apps/admin/components/editor/ComponentPropsPanel.tsx`          | 対応表に2ブロックを追加（`relatedPosts` は props なし）                               |
| `apps/admin/components/editor/ArticleEditor.tsx`                | スキーマに2ブロック、スラッシュメニューの「コンポーネント」に2項目を追加              |
| `apps/admin/lib/mock/blog.ts` / `apps/admin/lib/queries.ts`     | 追加。タグの仮データと queryOptions                                                   |
| `**/*.test.ts(x)`                                               | テストを追加                                                                          |

## 実装メモ

- **`blogList` の props は「タグタブを出すか」「タブに出すタグ」の2つだけにした。** 表示件数・「すべて見る」はデザインの注釈でも `newsList #13（件数・すべて見る）` とホームの `newsList` にだけ付いており、Blog一覧には無いため
- **タブに出すタグ（`tags`）は、タグの ID をカンマ区切りで並べた文字列にした。** `newsList` と同じで、BlockNote の props は文字列・数値・真偽値しか持てないため。空の ID（`a,,b` など）は schema で拒否する。タブの並びは選んだ順ではなくタグの一覧の順
- **`parseBlogListTags` は `parseNewsListTags` と同じ実装を別名で足した。** #13〜#20 を並列のブランチで進めていて、共通化すると `newsList` 側のファイルまで触ることになり衝突しやすいため。ブログ・お知らせの API を入れる回（#56 / #57）に合わせてまとめるのがよさそう
- **カードのリンク先・関連する記事のリンク先は `/blogs/:id` にした。** まだルートが無いので TanStack Router の `Link` は型で通らず、`<a href>` にしている（ページができたら `Link` にする）。#13 のお知らせが `/news/:id` にしているのに倣った
- **`relatedPosts` は0件のときブロックごと出さない。** 記事の途中に大きな空状態を出したくないため、#13 の `adjacentPosts`（前後の記事が両方無ければ出さない）に揃えた。一覧の空状態（`EmptyState`）は `blogList` にだけ出す
- **関連する記事のサムネイルは画像を出し、無ければグレーの枠だけにした。** デザインの「関連記事」はサムネがグレーの角丸四角のままだが、ブログのサムネが入る場所と判断した。`BlogCard` のサムネも同じく、画像が無ければグレーの枠だけを出す
- **関連する記事は仮データをそのまま出すだけにした。** 何で関連を決めるか（タグ・手動）は #57 の範囲なので、絞り込みのロジックは入れていない
- **日付はデザインどおりゼロ埋めしない（「6月2日」「5月28日」）。** `dateFormatter` の `MM` / `DD` を `Number()` で戻した（#13 の `NewsRow` と同じ）
- **仮データのタグの ID（`prep` / `day` / `behind` / `review`）は web と admin で揃えている。** 管理者サイトは選択肢として名前を出すだけなので、タグの一覧だけを持つ
- **エディタのカードは設定の要約・説明の一文だけを出す。** アイコンはブログ一覧が `book-open`、関連する記事が `files`

## テスト

| テスト                                                      | 検証内容                                                                                                                                                                                                 |
| ----------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `packages/schema/src/article.test.ts`                       | `blogList` の受理（挿入直後・JSON 経由で content キーが消えた形）、タグの不正・props の欠け・型違い・余計な props・中身の拒否、エラーメッセージ、`parseBlogListTags`、`relatedPosts` の props なしの受理 |
| `apps/web/src/components/article/ArticleRenderer.test.tsx`  | カードの中身（日付・投稿者・タイトル・抜粋・タグ・リンク）、タブの並びと絞り込み、タグ未選択でタブを出さない、0件の空状態、関連する記事の見出し・リンク・0件                                             |
| `apps/admin/components/editor/ArticleEditor.test.tsx`       | 許可するブロックに2ブロックが入る、カードの要約・説明、パネルでタグを選ぶと props が変わる、props なしのパネル表示                                                                                       |
| `apps/admin/components/editor/ComponentPropsPanel.test.tsx` | 独自コンポーネントの判定、ブログ一覧のフォーム（初期値・タグの選択順・スイッチ・無効化・お知らせ一覧だけの props を出さない）、関連する記事の「設定する項目はありません」                                |

```
bun run format     ✅
bun run lint       ✅
bun run typecheck  ✅
bun run test       ✅
bun run build      ✅
```

画面の導線は触っていないので e2e は回していない。

### 動作確認（ローカル）

Playwright（headless Chromium）で、ログイン済みのセッションを入れ、記事 API の返事を差し替えて確認した（fesp-dev にデータを作らないため）。web は `--port 5186`、admin は `--port 3016` で立てて、確認後に止めた。

- ウェブアプリ（iPhone の幅 390px）
    - ブログ一覧: タブ「すべて・準備・当日・裏側・振り返り」と5件のカードが出て、「準備」を押すと2件に絞り込まれる
    - カードはサムネイル（16:9・角丸）・「6月2日 ・ 広報委員会」・タイトル・抜粋・`#準備` の順に出る。画像の無い1件はグレーの枠だけになる
    - 個別の形: #13 の画像・サマリーの下に「関連する記事」が出て、2件のリンク先が `/blogs/blog-4` `/blogs/blog-3` になる
    - 横スクロールが出ない。コンソールエラーが出ない
- 管理者サイト
    - 2つのカードに要約・説明が出る。ブログ一覧を選ぶとパネルにスイッチとタグのチェックボックス4つが出る
    - タグ「当日」を足すとカードが「タグタブ: あり（準備・当日）」に変わり、スイッチを切ると「タグタブ: なし」になってチェックボックスが選べなくなる
    - 関連する記事を選ぶとパネルに「設定する項目はありません」と出る
    - `/` のメニューを `burogu` で絞り込むとブログ一覧が出る
    - コンソールエラーが出ない

## 詰まった点

なし。

## 残課題

- [ ] `blogs` テーブル・API・管理画面のブログ一覧/編集・ブログ一覧/個別ページ、仮データの差し替え（#57）
- [ ] 関連する記事を何で決めるか（タグ・手動など）（#57）
- [ ] `parseNewsListTags` / `parseBlogListTags` の共通化（#56 / #57 に合わせて）
- [ ] テンプレートによるロック（#64）
- [ ] iPad の2ペイン（#67）
