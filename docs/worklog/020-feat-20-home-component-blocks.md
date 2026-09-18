---
title: ホーム（Home）の独自コンポーネントを作る
issue: 20
branch: 'feat/#20-home-component-blocks'
date: 2026-09-18
---

# 020 feat: #20 ホーム（Home）の独自コンポーネントを作る

## やったこと

`ui-design.pen` の `web / Home / iPhone` のうち、ホームにしか無い3つの独自コンポーネント（メインスライダー `mainHero` / 日付・天気の帯 `weatherBar` / その他のコンテンツ `contentList`）を、schema・ウェブアプリのレジストリ・管理者サイトのブロック定義の3点セットで追加した。
お知らせは #13 の `newsList` をそのまま置く。天気は #19 の `weatherQuery`・仮データ・天気のアイコンの対応をそのまま読む（仮データは足していない）。

## 変更したファイル

| ファイル                                                 | 変更内容                                                                                          |
| -------------------------------------------------------- | ------------------------------------------------------------------------------------------------- |
| `docs/app.md`                                            | 本文の描画の表に3ブロックと、ブロックごとの節を追記（別コミット）                                 |
| `docs/admin.md`                                          | コンポーネントの表に3ブロックと、ブロックごとの節を追記（別コミット）                             |
| `packages/schema/src/article.ts`                         | 3ブロックの props スキーマ・スライド/リンクのパーサと組み立てを追加し、記事ドキュメントに足す     |
| `apps/web/src/components/article/blocks/MainHero.tsx`    | 追加。画像・キャッチ・タイトル・ドット（押すと切り替え）                                          |
| `apps/web/src/components/article/blocks/WeatherBar.tsx`  | 追加。今日の日付・天気・最高/最低気温。押すと `/weather` へ                                       |
| `apps/web/src/components/article/blocks/ContentList.tsx` | 追加。リンクの2列グリッド（アイコン + 表示名）                                                    |
| `apps/web/src/components/article/block-registry.ts`      | 3ブロックを登録                                                                                   |
| `apps/admin/components/editor/blocks/*Block.tsx`         | 追加。`MainHeroBlock` / `WeatherBarBlock` / `ContentListBlock`。カードは設定の要約か説明の1文だけ |
| `apps/admin/components/editor/MainHeroPropsForm.tsx`     | 追加。スライドごとの入力欄（React Hook Form の `useFieldArray` + zod）                            |
| `apps/admin/components/editor/ContentListPropsForm.tsx`  | 追加。リンクごとの入力欄（アイコンはセレクト）                                                    |
| `apps/admin/components/editor/ComponentPropsPanel.tsx`   | 対応表に3ブロックを追加（`weatherBar` は props なし）                                             |
| `apps/admin/components/editor/ArticleEditor.tsx`         | スキーマに3ブロック、スラッシュメニューの「コンポーネント」に3項目を追加                          |
| `**/*.test.ts(x)`                                        | テストを追加                                                                                      |

## 実装メモ

- **複数件の props（スライド・リンク）は「1件を `|` 区切り、件の間を改行」の文字列1つにした。** BlockNote の props は文字列・数値・真偽値しか持てないため（#13 の `tags` と同じ考え方）。区切りに使う `|` と改行は値に入れられないよう schema で弾く（エラーは「キャッチに「|」は使えません」のように出す）
    - `packages/schema` に `parseMainHeroSlides` / `formatMainHeroSlides`、`parseContentListLinks` / `formatContentListLinks` を置き、ウェブアプリは読む側、管理者サイトのフォームは両方を使う
    - フォームは props の文字列ではなくスライド/リンクの配列を扱う。そのための `mainHeroSlidesSchema` / `contentListLinksSchema`（`z.array` を包んだもの）も schema に置き、1件ごとの検証（`mainHeroSlideSchema` / `contentListLinkSchema`）を正本にしている
- **props の検証は行が1つでも壊れていたら拒否する。** 途中まで描くより、記事ドキュメントの検証（`parseArticleDocument`）で他のブロックだけ残すほうが揃うため。`parse*` の関数自体は壊れた行を読み飛ばすが、これは保険
- **`contentList` のアイコンは lucide の名前の列挙（7つ）にした。** デザインに出てくる `calendar-days` / `map` / `store` / `music` / `newspaper` / `cloud-sun` / `clipboard-list`。増やすときは `contentListIcons` に足し、ウェブアプリ側の対応表（`ContentList.tsx`）と管理者サイトのセレクトの名前（`ContentListPropsForm.tsx`）にも足す
- **`contentList` のリンク先は `/` で始まるパスか `http(s)://` の URL だけ許す。** アンケートなど外部フォームへ飛ばせるようにするため（`javascript:` は弾く）
- **挿入した直後はスライド・リンクとも空にした。** `coverImage` と同じ扱いで、カードには「設定されていません（ウェブアプリには何も出ません）」と出す。デザインの7つをあらかじめ入れることも考えたが、リンク先のページがまだ無い（#57〜#62）ので見送った
- **スライダーはドットで切り替えるだけにした。** デザインに自動送り・スワイプの指定が無いため（指示どおり）。依存パッケージは足していない
- **`mainHero` と `weatherBar` は画面の端まで出すため `-mx-4` で AppShell の左右の余白を打ち消している**（`coverImage` と同じ）
- **`weatherBar` は #19 の `weatherQuery` をそのまま読む。** 仮データもアイコンの対応（`components/weather/weather-kinds.ts`）も足していないので、同じページに天気のブロックを置いても読み込みは1回
- **気温はデザインの `25.6°` ではなく整数で出した**（`docs/app.md` の「天気のブロック」の決まりに合わせた）
- **Tailwind はデフォルトスケールに寄せた。** 高さ 219 → `h-56`、角丸 14 → `rounded-xl`、余白 20/14/10 → `p-5` / `py-3` / `gap-2`・`gap-3`。ドットは 18×6 / 6×6 →`h-2 w-5` / `size-2`。アイコンは `size` で渡す
- **読み上げ用に `sr-only` の文字を足した**（天気の種類、色だけで区別している最高/最低）

## テスト

| テスト                                                       | 検証内容                                                                                                                                                   |
| ------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `packages/schema/src/article.test.ts`                        | 3ブロックの受理（挿入直後の空文字を含む）、項目数・URL・アイコン・リンク先・文字数・区切りの文字の拒否、エラーメッセージ、パーサと組み立ての往復           |
| `apps/web/src/components/article/ArticleRenderer.test.tsx`   | スライダーの表示とドットでの切り替え・1枚ならドットなし・0枚や形違いで出さない、日付・天気の帯（日付/気温/リンク先・未取得なら出さない）、リンクのグリッド |
| `apps/admin/components/editor/ArticleEditor.test.tsx`        | 許可するブロックに3つが入る、カードの要約・説明、パネルで入力するとカードと `onChange` に反映、`weatherBar` は「設定する項目はありません」                 |
| `apps/admin/components/editor/ComponentPropsPanel.test.tsx`  | 独自コンポーネントの判定、スライド/リンクの追加・削除・アイコンの選択で1行1件の文字列になる、URL・リンク先・文字数のエラーで渡さない                       |
| `apps/admin/components/editor/MainHeroPropsForm.test.tsx`    | props の文字列を入力欄の並びにする、0件のときに追加して埋めると props を渡す                                                                               |
| `apps/admin/components/editor/ContentListPropsForm.test.tsx` | 同上（リンク）                                                                                                                                             |

```
bun run format    ✅
bun run lint      ✅
bun run typecheck ✅
bun run test      ✅
bun run build     ✅
```

画面の導線は触っていないので e2e は回していない。

### 動作確認（ローカル）

Playwright（headless Chromium）で、ログイン済みのセッションを入れ、記事 API の返事を差し替えて確認した（fesp-dev にデータを作らないため）。web は `--port 5189`、admin は `--port 3019` で立てて、確認後に止めた。

- ウェブアプリ（iPhone 14）
    - スライダーが画面の幅いっぱい（390×224）で出て、キャッチ・タイトル・ドット3つが重なる。2つ目のドットを押すと2枚目のキャッチ・タイトル・画像に変わる
    - 帯に「9/18 (金)」「晴れのアイコン」「25° / 18°」「>」が出て、`/weather` へのリンクになっている
    - その他のコンテンツが2列で7件（スケジュール・マップ・模擬店・出演者・ブログ・天気・アンケート）出て、1件目のリンク先は `/schedule`
    - 横スクロールが出ない。コンソールエラーが出ない
- 管理者サイト
    - 3つのカードに要約・説明が出る（スライド: 2枚 / 1. あおば祭へ、ようこそ、リンク: 1件 / スケジュール → /schedule、リンクが設定されていません…）
    - メインスライダーを選ぶとパネルにスライドごとの入力欄が出て、タイトルを直すとカードの要約が変わる。URL に `hero.jpg` を入れるとエラーが出る
    - その他のコンテンツで「リンクを追加」→ 表示名・リンク先を入れ、アイコンで「地図」を選ぶとカードが「マップ → /map」になる
    - 日付・天気の帯を選ぶとパネルに「設定する項目はありません」と出る
    - `/` のメニューで `suraida` と打つと「メインスライダー」が出て、選ぶとブロックが入りパネルが開く
    - 保存すると `PUT /api/articles/:id` の本文に3ブロックの props が入る（`slides` は1行1枚、`links` は1行1件）
    - コンソールエラーが出ない

## 詰まった点

- **props の検証（1行でも壊れていたら拒否）と、仕様に書いた「形の合わない行は読み飛ばす」が噛み合わなかった。** 記事ドキュメントの検証を通らないブロックはそもそも描画まで来ないので、仕様側から「読み飛ばす」を落とし、拒否に揃えた（仕様書のコミットに含めてある）

## 残課題

- [ ] ホーム用テンプレートの定義・管理画面のホーム編集・ホームページ（#63）
- [ ] リンク先のページ（スケジュール #58・マップ #59・模擬店 #60・出演者 #61・天気 #62 など）。できたら `contentList` の既定のリンクを用意するか検討する
- [ ] スライドの画像のアップロード（いまは URL 指定のみ）
- [ ] iPad の2カラム（#67）
