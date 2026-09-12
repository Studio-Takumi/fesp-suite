---
title: ほげほげふがふが
issue: 0
branch: 'feat/#0-hoge-fuga'
date: 2026-01-01
---

# 000 feat: #0 ほげほげふがふが

> このファイルはテンプレート。`docs/worklog/001-feat-hoge-fuga.md` のようにコピーして使う。
> ファイル名は `<連番3桁>-<ブランチ名の`/`を`-`にしたもの>.md`（例: `feat/#1-hoge-fuga` → `001-feat-hoge-fuga.md`）。
> 引用ブロックのこの注意書きは消すこと。

## やったこと

何を作ったのか。1〜3行で。背景や「なぜ必要か」は Issue 側にあるので、ここには結果を書く。

## 変更したファイル

| ファイル                      | 変更内容                       |
| ----------------------------- | ------------------------------ |
| `packages/schema/src/hoge.ts` | 追加。hoge の zod スキーマ     |
| `apps/api/src/routes/hoge.ts` | 追加。`GET /hoge` `POST /hoge` |
| `apps/web/src/pages/hoge.tsx` | 追加。一覧画面                 |
| `docs/api.md`                 | `/hoge` のエンドポイントを追記 |

## 実装メモ

設計上の判断と、その理由。あとから「なぜこう書いたのか」を追えるように残す。

- 〜は〜にした（理由: 〜）
- 〜は見送った（理由: 〜。やるなら〜）

## テスト

| テスト                             | 検証内容                       |
| ---------------------------------- | ------------------------------ |
| `apps/api/src/routes/hoge.test.ts` | zod バリデーション・認可の分岐 |
| `apps/web/src/pages/hoge.test.tsx` | 一覧の表示とエラー時の表示     |

```
bun run format   ✅
bun run lint     ✅
bun run typecheck ✅
bun run test     ✅
bun run build    ✅
```

## 詰まった点

なければ「なし」。同じことで次に詰まらないように、原因と解決を書く。

## 残課題

このPRでは触らなかったこと。Issue に切ったなら番号を書く。

- [ ] 〜（#0）
