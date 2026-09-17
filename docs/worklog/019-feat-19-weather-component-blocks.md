---
title: 天気（Weather）の独自コンポーネントを作る
issue: 19
branch: 'feat/#19-weather-component-blocks'
date: 2026-09-18
---

# 019 feat: #19 天気（Weather）の独自コンポーネントを作る

## やったこと

`ui-design.pen` の `web / Weather / iPhone` を、props を持たない6つの独自コンポーネント（`todayWeather` / `weeklyForecast` / `weatherAlert` / `wbgt` / `weatherOverview` / `weatherCredit`）に分けて、schema・ウェブアプリのレジストリ・管理者サイトのブロック定義の3点セットで追加した。
表示するデータは仮データで、ウェブアプリの `weatherQuery` の裏に置いた。管理者サイトでは、props を持たないブロックを選んだときもサイドパネルを出し「設定する項目はありません」と出す。

## 変更したファイル

| ファイル                                               | 変更内容                                                                                                    |
| ------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------- |
| `docs/app.md`                                          | 本文の描画の表に6ブロックを足し、「天気のブロック」と各ブロックの節を追記（別コミット）                     |
| `docs/admin.md`                                        | コンポーネントの表に6ブロック、props なしのパネルの文言、「天気のブロック」の節を追記（別コミット）         |
| `packages/schema/src/article.ts`                       | `emptyComponentPropsSchema`・`weatherComponentTypes` を追加し、記事ドキュメントのブロックに6つを足す        |
| `apps/web/src/lib/mock/weather.ts`                     | 追加。天気のデータの型（`Weather`）と仮データ（`createMockWeather`）                                        |
| `apps/web/src/lib/queries.ts`                          | `weatherQuery` を追加（queryFn で仮データを `Promise.resolve` で返す）                                      |
| `apps/web/src/components/weather/weather-kinds.ts`     | 追加。天気の種類 → 読み上げる名前・lucide のアイコン・色                                                    |
| `apps/web/src/components/article/blocks/*.tsx`         | 追加。`TodayWeather` / `WeeklyForecast` / `WeatherAlert` / `Wbgt` / `WeatherOverview` / `WeatherCredit`     |
| `apps/web/src/components/article/block-registry.ts`    | 6ブロックを登録                                                                                             |
| `apps/web/src/test/render.tsx`                         | `createTestQueryClient` / `renderWithQueryClient` を追加（`renderApp` も `createTestQueryClient` を使う）   |
| `apps/admin/components/editor/blocks/*Block.tsx`       | 追加。6ブロックの定義。カードの中身は説明の1文だけ                                                          |
| `apps/admin/components/editor/ComponentPropsPanel.tsx` | `ComponentBlock` に天気の6つを足し、`renderForm` の無いコンポーネントは「設定する項目はありません」と出す   |
| `apps/admin/components/editor/ArticleEditor.tsx`       | スキーマに6ブロック、スラッシュメニューの「コンポーネント」を配列（`componentSlashMenuItems`）にして6つ追加 |
| `**/*.test.ts(x)`                                      | テストを追加                                                                                                |

## 実装メモ

- **仮データは `createMockWeather(now)` の1つにまとめた。** 週間予報の「今日」「明日」が常に出るよう、日付は呼んだ時点から作る。6ブロックとも `weatherQuery` を読むので、同じページに複数置いても読み込みは1回
- **仮データの形は #20 の `weatherBar` でも使えるようにした。** `today` に日付（`YYYY-MM-DD`）・天気・現在/最高/最低の気温・降水確率を持たせている。天気の種類とアイコンの対応（`components/weather/weather-kinds.ts`）もブロックの外に置いたので、そのまま使える
- **天気の種類は `sunny` / `partlyCloudy` / `cloudy` / `rainy` の4つ。** デザインに出てくるアイコン（sun / cloud-sun / cloud / cloud-rain）に合わせた。雪などは本物の API を繋ぐときに足す
- **型は仮データのファイルに置き、`packages/schema` には置かなかった。** API もレスポンスのスキーマもまだ無いため。API を作るとき（#62 など）に schema に移す
- **読み込み中・失敗したときは、ブロックごと出さない。** 取得の単位がコンポーネントなので、天気が読めなくてもページの他の部分は出る（docs/article-system.md）
- **警報・注意報が無いときの形はデザインに無かったので、ブロックごと出さない**（指示どおり）
- **暑さ指数の段階の区切り・一言はデザインの凡例（〜25 / 25〜 / 28〜 / 31〜 / 33〜）から決めた。** 一言はデザインにある「運動時は積極的に休憩を」（警戒）以外は、環境省の指針を参考に書いた
- **Tailwind はデフォルトスケールに寄せた。** 角丸 18/16/14 → `rounded-2xl` / `rounded-xl`、文字 52/28/15/13/11/9 → `text-5xl` / `text-3xl` / `text-base` / `text-sm` / `text-xs` / `text-xs`、帯の隙間 2px → `gap-px` など。アイコンは `size` で渡す
- **読み上げ用に `sr-only` の文字を足した。** アイコンだけの天気（「晴れ」など）、色だけで区別している最高/最低、チップの「警報」「注意報」
- **props なしのサイドパネルは、対応表の `renderForm` を省略できるようにして作った。** 並列の他のブランチでも同じ仕組みを作るかもしれないので、マージのときに揃える
- **スラッシュメニューの独自コンポーネントは配列にまとめた。** 挿入後にカーソルを戻す処理（#24）を7つ分書かずに済むようにするため

## テスト

| テスト                                                           | 検証内容                                                                                                                                                                                                                                       |
| ---------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `packages/schema/src/article.test.ts`                            | 6ブロックを props なし（JSON 経由で content が消えていても）で受理する、props がある・無い・中身があれば拒否する、`emptyComponentPropsSchema`                                                                                                  |
| `apps/web/src/components/article/blocks/weather-blocks.test.tsx` | 今日の天気の表示、週間予報の「今日」「明日」「14(月)」の見出しと0件で出さない、警報/注意報のチップの色と無いとき出さない、暑さ指数の段階の境目（24.9/25/28/31/33）、概況が空なら出さない、更新時刻を日本時間で出す、読み込み中・失敗で出さない |
| `apps/web/src/components/article/ArticleRenderer.test.tsx`       | 6ブロックをレジストリ経由で天気のデータから描画する                                                                                                                                                                                            |
| `apps/admin/components/editor/ArticleEditor.test.tsx`            | 許可するブロックに6つが入る、カードに名前と説明の1文を出す、カーソルが天気のブロックにあればパネルに名前と「設定する項目はありません」を出す                                                                                                   |
| `apps/admin/components/editor/ComponentPropsPanel.test.tsx`      | 天気の6つを独自コンポーネントと判定する、props なしのコンポーネントは名前と「設定する項目はありません」を出し、入力欄を出さない                                                                                                                |

```
bun run format    ✅
bun run lint      ✅
bun run typecheck ✅
bun run test      ✅
bun run build     ✅
```

### 動作確認（ローカル）

Playwright（headless Chromium）で、ログイン済みのセッションを入れ、API の返事を差し替えて確認した（fesp-dev にテスト用のデータを作らないため）。web は `--port 5184`、admin は `--port 3014` で立て、確認後に止めた。

- ウェブアプリ（iPhone 14）で、ページ見出しと6ブロックを置いた記事がデザインに近い見た目で出る。週間予報は横にスクロールする
- 管理者サイトで、6ブロックがカードと説明の1文で出る。暑さ指数をクリックすると「編集中」になり、パネルに「暑さ指数」「設定する項目はありません」と出る
- スラッシュメニューで `tenki` と打つと「コンポーネント」グループに天気のブロックが出て、「天気概況」を選ぶとブロックが入りパネルが開く。保存すると `PUT /api/articles/:id` の本文に `weatherOverview` が入る
- コンソールエラーが出ない

## 詰まった点

- **週間予報を置くと、iPhone の幅でページ全体が横に広がった。** 横スクロールの中の `sr-only`（`position: absolute`）が、位置の基準がスクロールの外にあるためはみ出していた。スクロールする `ul` を `relative` にして解決した

## 残課題

- [ ] 天気の取得（外部 API）・天気ページ（#62）。仮データの型を `packages/schema` に移し、`weatherQuery` の queryFn を差し替える
- [ ] 今日の天気のバー `weatherBar`（#20）はこの仮データ・`weatherQuery` を使う
