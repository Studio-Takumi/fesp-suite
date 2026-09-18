---
title: ウェブアプリのコンポーネント構成・定義順をリファクタする
issue: 88
branch: 'refactor/#88-web-component-dedupe'
date: 2026-09-19
---

# 088 refactor: #88 ウェブアプリのコンポーネント構成・定義順をリファクタする

## やったこと

ウェブアプリの独自コンポーネントに散っていた重複をまとめた。日付タブ・Day バッジ・サマリーの遷移ボタンを
共通の部品にし、`ArtistSummary` の作りを `ShopSummary` に揃え、`block-registry.ts` の並びを
管理者サイトのスラッシュメニューと同じ順にした。挙動は変えていない。

## 変更したファイル

| ファイル                                                      | 変更内容                                                                                        |
| ------------------------------------------------------------- | ----------------------------------------------------------------------------------------------- |
| `apps/web/src/components/common/DayBadge.tsx`                 | 追加。開催日のバッジ（`Day1` など）。色は `className` で受ける                                  |
| `apps/web/src/components/common/ActionLink.tsx`               | 追加。サマリーの下の遷移ボタン。`primary`（水色）/ `secondary`（グレー）                        |
| `apps/web/src/components/list/DateTabs.tsx`                   | `ListDateTabs.tsx` から改名。`showAll`（「すべて」を出すか）と `align`（並べ方）を props に追加 |
| `apps/web/src/components/article/blocks/ScheduleTable.tsx`    | 中で定義していた日付タブを削除し、共通の `DateTabs` を使う形にした                              |
| `apps/web/src/components/article/blocks/ShopList.tsx`         | `DateTabs` に差し替え（`showAll` を渡す）                                                       |
| `apps/web/src/components/article/blocks/ArtistList.tsx`       | 同上                                                                                            |
| `apps/web/src/components/article/blocks/ShopSummary.tsx`      | Day バッジと「マップで見る」を共通の部品に差し替え                                              |
| `apps/web/src/components/article/blocks/ArtistSummary.tsx`    | 内部の `Summary` / `SummaryRow` をやめ、`ShopSummary` と同じ形にした                            |
| `apps/web/src/components/shop/ShopCard.tsx`                   | Day バッジを `DayBadge` に差し替え                                                              |
| `apps/web/src/components/artist/ArtistCard.tsx`               | 同上                                                                                            |
| `apps/web/src/components/article/blocks/map/MapPlaceList.tsx` | 同上。余白が小さかったバッジを他の4か所に揃えた                                                 |
| `apps/web/src/components/article/block-registry.ts`           | 独自コンポーネントをスラッシュメニューの順に並べ替え、行末に表示名のコメントを付けた            |

## 実装メモ

- **日付タブの見た目は一覧側に揃えた**（`font-en`・`text-lg`・`h-10`）。スケジュール表の日付が `text-xl` から
  `text-lg` になり、英字に `font-en`（Inter）が付く。`docs/app.md` の「英字のラベルは Inter で出す」に合わせている。
  中央寄せかどうかだけ差が残るので、`align`（`start` = 左寄せで横スクロール / `center` = 中央寄せ）を props にした
- **`showAll` は必須の props にした**。「すべて」を出すのは一覧だけで、スケジュール表では出さない。
  既定値を持たせると呼び出し側から抜けても気づけないので、3か所とも明示して渡す
- **スケジュール表は今までどおり1日目を最初に出す**。「現在に最も近い日」は管理者が選べるようにするので #89 に切った
- **`DayBadge` の色は `className` で受ける**。模擬店は `cardColors[color].accent`、出演者は `cardColorFromId(id).accent`、
  マップは並び順の色と、決め方が3通りあるため、バッジ側は色を知らない形にした
- **マップの場所の一覧のバッジだけ余白が小さかった**（`px-2`・上下なし・`font-semibold`）ので、他の4か所
  （`px-3 py-1`・`font-bold`）に揃えた。`docs/app.md` に余白の記述は無いので仕様は変わらない
- **ボタンをまとめた「アクション」のコンポーネントは作らなかった**（発注者と合意）。並べ方はブロックごとに違うので、
  1つ分のボタン（`ActionLink`）だけを共通にし、並べるのは各ブロックに残している
- **`block-registry.ts` のグループの切れ目は空行で表した**。コメントはスラッシュメニューの表示名だけにして、
  グループ名は入れていない（メニュー側を並べ替えたときに両方直す手間を減らすため）

## テスト

| テスト                                                | 検証内容                                                                |
| ----------------------------------------------------- | ----------------------------------------------------------------------- |
| `apps/web/src/components/common/common.test.tsx`      | 追加。`DayBadge` の表示と色のクラス、`ActionLink` のリンク先と塗り      |
| `apps/web/src/components/list/list.test.tsx`          | `DateTabs` に改名。「すべて」を出さないときは開催日のタブだけになること |
| `ScheduleTable.test.tsx` などの既存のブロックのテスト | 変えていない。そのまま通ることを、振る舞いを変えていない証明にした      |

```
bun run format    ✅
bun run lint      ✅
bun run typecheck ✅
bun run test      ✅
bun run build     ✅
bun run e2e       ✅（web・lp とも chromium / mobile-safari）
```

## 詰まった点

なし。

## 残課題

- [ ] スケジュール表の「最初に出す日」を管理者が選べるようにする（#89）
- [ ] 模擬店・出演者のアクションを別ブロックにし、カードの色をデータで持つ（#80）
