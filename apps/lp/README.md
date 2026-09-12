# @fesp/lp — LPサイト

サービス紹介の公開サイト。SEOと初期表示重視で **Next.js 16（SSG）**、
アニメーションは **Framer Motion**。

> 現状は配線確認用の仮ページのみ。サービス名・コピーは未定。

## 立ち上げ方

```bash
bun run dev                      # → http://localhost:3000
bun run build && bun run start   # 本番ビルドの確認
```

ルートからなら `bun run dev --filter @fesp/lp`。
API や Supabase には繋がないので、**これ単体で動く**。

## ディレクトリ

```
app/
├─ layout.tsx          メタ情報（title / OGP / themeColor）※サービス名が決まったら差し替え
├─ page.tsx            ページ本体
└─ globals.css         Tailwind プリセットの読み込み
components/
├─ hero.tsx            ファーストビュー（`animate` でのフェードイン）
└─ scroll-section.tsx  スクロール連動（`whileInView`）の書き方の見本
```

アニメーションは `useReducedMotion()` でOSのモーション低減設定を尊重している。

## テスト

Playwright のみ（表示中心のため。アニメーションは追わない）。

```bash
bun run e2e     # 本番ビルドを起動して表示を確認
```

初回だけ `bunx playwright install chromium` が必要。
`bun run test` は何もしない（テスト戦略どおり）。

## デプロイ

```bash
bun run preview   # OpenNext でビルドしてローカルプレビュー
bun run deploy    # Cloudflare Workers（OpenNext）へ
```
