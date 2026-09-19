---
title: CI の待ち時間を削る
issue: 103
branch: 'chore/#103-ci-parallel-e2e'
date: 2026-09-19
---

# 103 chore: #103 CI の待ち時間を削る

## やったこと

CI が毎回4分近くかかっていたのを、`e2e` ジョブを `verify` と並列に走らせて2分程度にした。
あわせて `e2e` ジョブの中の無駄（Playwright のブラウザの再取得、管理者サイトの空ビルド）を削った。

## 変更したファイル

| ファイル                          | 変更内容                                                             |
| --------------------------------- | -------------------------------------------------------------------- |
| `.github/workflows/ci.yml`        | `e2e` の `needs: verify` を削除。Playwright のキャッシュを追加       |
| `apps/admin/playwright.config.ts` | `webServer` をコメントアウト。全テストが skip の間は Next を立てない |

## 実装メモ

- **まず計測した。** 直近3ランをステップ単位で見ると、`verify` 2分05秒 → `e2e` 1分35秒の直列で、
  E2E のテスト本体は 44 秒（lp 35秒・web 36秒・admin skip の並列）しかなかった。
  「E2E が遅い」のではなく待ちが長かった

- **`needs: verify` を外した。** `e2e` ジョブは `verify` の成果物を一切使っておらず、自分で
  `bun install` して自分でビルドし直している。直列にする理由が無かった。public リポジトリなので
  Actions の実行時間は無料で、`verify` が落ちたときに `e2e` も回る分の持ち出しは無い

- **Playwright の40秒は、ほとんどがブラウザではなく OS 依存パッケージだった。**
  内訳は `apt-get update` 8秒 / パッケージ取得（181個・114MB）3秒 / dpkg の展開・設定 15秒 /
  ブラウザ本体のDL 11秒。181個の大半は webkit が要求する gstreamer 一式。
  そのため `~/.cache/ms-playwright` のキャッシュで浮くのは 11 秒だけ。
  `install-deps`（毎回）と `install`（キャッシュが当たれば実質スキップ）に分けた

- **webkit は落とさなかった。** `mobile-safari` プロジェクト（`devices['iPhone 14']`）が使っていて、
  apt の 26 秒はこれが理由。ただし iPhone/iPad の見た目を追っているこのプロジェクトでは
  実際の WebKit で見る価値のほうが大きい

- **管理者サイトの E2E は Next をフルビルドして1件も走っていなかった。**
  `collaborative-editing.spec.ts` が先頭で `test.skip(true, ...)` しているのに、
  `webServer` の `next build && next start` は毎回動く。コメントアウトし、skip を外すときに
  戻すとコメントで残した。`E2E_BASE_URL` を渡したときの振る舞いは変えていない

- **Playwright のバージョンは `bunx playwright --version` から取ってキャッシュキーにした。**
  `bun.lock` の hash をキーにすると、関係ない依存の更新でも毎回外れる

## テスト

CI ワークフローの変更なのでテストコードは追加していない。検証は実際の CI ラン
（3ジョブの所要時間と、2回目以降のキャッシュのヒットを PR で確認する）。

E2E は設定を触ったので全部通してある。管理者サイトが Next を立てずに skip まで進むことも確認した。

```
bun run format   ✅
bun run lint     ✅
bun run typecheck ✅
bun run test     ✅
bun run build    ✅
bun run e2e      ✅
```

## 詰まった点

- **最初「ブラウザのキャッシュで40〜70秒浮く」と見積もったが外れていた。**
  ステップの所要時間だけ見て中身を見ていなかった。ログを行単位で追うと apt が 26 秒で、
  キャッシュで浮くのは 11 秒だった。Issue の見積もりを実測に直してから実装した

## 残課題

`verify` が新しいボトルネックになる（CI 全体 ≒ `verify` の 2分05秒）。次に効くのは turbo の
リモートキャッシュだが、設定と運用が増えるので別に分けた。

- [ ] turbo のリモートキャッシュ（いまは `Remote caching disabled` で、`verify` のビルド1分半が毎回フル）
- [ ] ウェブアプリの E2E の `workers: 1` を増やす（10テストで36秒。不安定化と引き換え）
- [ ] 管理者サイトの同期編集の E2E を実装して skip を外す（エディタ画面・PartyKit の起動が要る）
