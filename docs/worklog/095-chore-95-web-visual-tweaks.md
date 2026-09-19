---
title: ウェブアプリの見た目を整える
issue: 95
branch: 'chore/#95-web-visual-tweaks'
date: 2026-09-19
---

# 095 chore: #95 ウェブアプリの見た目を整える

## やったこと

ウェブアプリの一覧・カード・天気まわりで、余白・文字サイズ・角丸がばらついていたところを揃えた。
`body` のフォントを欧文 Inter + 和文 Noto Sans JP の混植にし、マップのカテゴリタブの下に区切り線を引いて、
スケジュールの会場ヘッダーの下の区切り線をやめた。デザイン（`ui-design.pen`）にも同じ調整を入れてある。

## 変更したファイル

| ファイル                                                         | 変更内容                                                                  |
| ---------------------------------------------------------------- | ------------------------------------------------------------------------- |
| `apps/web/src/index.css`                                         | `body` を欧文 Inter + 和文 Noto Sans JP の混植にした                      |
| `apps/web/src/components/list/DateTabs.tsx`                      | 高さを `h-8` に。「Day1」を主役、日付を従、曜日を `text-[8px]` にした     |
| `apps/web/src/components/list/ListSearch.tsx`                    | 高さを `h-8` に                                                           |
| `apps/web/src/components/list/ListSort.tsx`                      | 高さを `h-8` に                                                           |
| `apps/web/src/components/shop/ShopCard.tsx`                      | 店名を `text-2xl` に。価格を丸い枠にし、「円」だけ小さくした              |
| `apps/web/src/components/news/NewsRow.tsx`                       | 行の上下の余白をやめた（一覧側の `gap` に寄せた）                         |
| `apps/web/src/components/article/blocks/NewsList.tsx`            | 一覧を `gap-4` に                                                         |
| `apps/web/src/components/article/blocks/BlogList.tsx`            | 一覧を `gap-8` にし、上下の余白をやめた                                   |
| `apps/web/src/components/article/blocks/ShopList.tsx`            | 一覧を `gap-8 py-2` に                                                    |
| `apps/web/src/components/article/blocks/ArtistList.tsx`          | 一覧を `gap-8 py-2` に                                                    |
| `apps/web/src/components/article/blocks/AdjacentPosts.tsx`       | 上下の余白を `py-2` に                                                    |
| `apps/web/src/components/article/blocks/PageHeader.tsx`          | 上に `mt-4` を足した                                                      |
| `apps/web/src/components/article/blocks/ScheduleTable.tsx`       | 会場ヘッダーの区切り線をやめ、会場名・項目名を1段大きくした               |
| `apps/web/src/components/article/blocks/TodayWeather.tsx`        | 角丸を `rounded-lg` に。気温を `font-medium` に                           |
| `apps/web/src/components/article/blocks/Wbgt.tsx`                | 角丸を `rounded-lg` に                                                    |
| `apps/web/src/components/article/blocks/WeatherAlert.tsx`        | 角丸を `rounded-lg`、チップを `rounded-sm` に                             |
| `apps/web/src/components/article/blocks/WeeklyForecast.tsx`      | 角丸を `rounded-lg` に。曜日を `font-semibold text-slate-400` に          |
| `apps/web/src/components/article/blocks/map/MapCategoryTabs.tsx` | タブの下に区切り線を引いた                                                |
| `apps/web/src/components/article/blocks/map/MapPlaceList.tsx`    | サムネを `size-16 rounded-lg` に。行の余白を一覧側の `space-y-2` に寄せた |
| `apps/web/src/components/article/ArticleRenderer.test.tsx`       | 価格の照合を要素をまたぐ matcher にした                                   |
| `docs/app.md`                                                    | マップとスケジュールの区切り線の記述を合わせた                            |
| `docs/design/ui-design.pen`                                      | 上の調整をデザインにも反映した                                            |

## 実装メモ

- **`body` のフォントは `var(--font-en)` をそのまま並べなかった**（理由: `--font-en` は
  `'Inter Variable', ui-sans-serif, system-ui, sans-serif` で、末尾の `sans-serif` が和文も引き受けて
  しまうため、`var(--font-jp)` まで届かない。`font-family: 'Inter Variable', var(--font-jp)` と書いて、
  欧文を Inter、和文を Noto Sans JP に振り分けている。`font-en` / `font-jp` のユーティリティ側は
  そのまま）
- **行の上下の余白は、行ではなく一覧側の `gap` で取るようにした**（理由: 行が `py-*` を持つと
  一覧の先頭・末尾にも余白が出て、ブロックどうしの間隔がそろわない。`NewsRow`・マップの場所の行は
  余白を持たず、`NewsList`・`MapPlaceList` の `gap` / `space-y` で間を取る）
- **Dayタブの主役を入れ替えた**（理由: 押して選ぶのは「日付」ではなく「何日目か」なので、
  `Day1` を大きく濃く、日付・曜日を小さく薄くした。曜日は `text-[8px]` で、Tailwind のスケールに
  無いので任意値）
- **角丸は `rounded-lg` に寄せた**（理由: `rounded-2xl` / `rounded-xl` / `rounded-md` が箇所ごとに
  混ざっていた。写真を出すサムネイルだけは `rounded-2xl` / `rounded-xl` のまま残してある）
- **マップのカテゴリタブの区切り線は、デザインに元からあったものを実装に入れた。**
  逆にスケジュールの会場ヘッダーの区切り線は、実装に合わせてデザインから消した
- **`ui-design.pen` のDayタブは、日付と曜日を1つの枠にまとめた**（理由: 実装は `Day1` の後ろだけ
  `pr-2` で空け、日付と曜日はくっつけている。pen の `gap` は1つしか持てないので、枠を分けた）

## テスト

| テスト                                                     | 検証内容                                           |
| ---------------------------------------------------------- | -------------------------------------------------- |
| `apps/web/src/components/article/ArticleRenderer.test.tsx` | 模擬店カードの商品の価格（既存テストの照合を修正） |

```
bun run format    ✅
bun run lint      ✅
bun run typecheck ✅
bun run test      ✅
bun run build     ✅
bun run e2e       ✅（web・lp とも chromium / mobile-safari）
```

## 詰まった点

- **`font-family: var(--font-en) var(--font-jp)` は CSS として不正だった。**
  `var()` を展開すると `sans-serif 'Noto Sans JP Variable'` という「識別子のあとに文字列」が現れ、
  宣言ごと無効になって `body` がブラウザ既定のフォントに落ちる。カンマを足すだけでは
  `--font-en` 末尾の `sans-serif` が和文を先に拾うので、Inter を直接並べる形にした
- **模擬店カードの価格を `200` と `円` の2要素に分けたことで、既存テストが落ちた。**
  Testing Library の `getByText` は要素の直下のテキストノードだけを見るので、`'200円'` では
  合わなくなる。要素の `textContent` で照合する matcher（`priceText`）を足した

## 残課題

- [ ] マップの場所の一覧は、デザインでは行のあいだに区切り線（`slate-100`）があるが実装には無い。
      どちらに寄せるか未決（この Issue の範囲外）
- [ ] 模擬店カードの写真サムネイルの角丸（`rounded-2xl` / `rounded-xl`）は今回そろえていない
