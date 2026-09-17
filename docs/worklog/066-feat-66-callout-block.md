---
title: 記事エディタ：注意書き（callout）のブロックを足す
issue: 66
branch: 'feat/#66-callout-block'
date: 2026-09-18
---

# 066 feat: #66 記事エディタ：注意書き（callout）のブロックを足す

## やったこと

読み飛ばされたくない文章を色付きの枠で囲む注意書きのブロック `callout`（`ui-design.pen` の「注意事項」）を、schema・管理者サイトのブロック定義・ウェブアプリのレジストリに追加した。
独自コンポーネントではなくテキスト系のブロックで、見出しは種類（情報 / 注意 / 警告）で固定し、本文と Tab で入れた子ブロックを枠の中で直接編集する。種類は枠の左上のアイコンのメニューで切り替える。

## 変更したファイル

| ファイル                                                | 変更内容                                                                                                 |
| ------------------------------------------------------- | -------------------------------------------------------------------------------------------------------- |
| `docs/app.md`                                           | 本文の描画に `callout` と「注意書き」の節を追記（別コミット）                                            |
| `docs/admin.md`                                         | 記事エディタに「注意書き」の節を追記（別コミット）                                                       |
| `packages/schema/src/article.ts`                        | `calloutVariantSchema` を追加し、記事ドキュメントのブロックに `callout`（props は `variant` だけ）を足す |
| `apps/admin/components/editor/blocks/CalloutBlock.tsx`  | 追加。`createReactBlockSpec` で中身を持つ（`content: 'inline'`）ブロックと、種類を選ぶメニューを定義     |
| `apps/admin/components/editor/ArticleEditor.tsx`        | スキーマに `callout`、スラッシュメニューの「基本ブロック」の引用の後ろに「注意書き」を追加               |
| `apps/admin/app/globals.css`                            | 注意書きの枠と種類ごとの色を、子ブロックを含むブロック全体（`.bn-block`）に付ける                        |
| `apps/web/src/components/article/blocks/Callout.tsx`    | 追加。見出しの行（アイコン＋表示名）・本文・子ブロックを種類ごとの色の枠の中に出す                       |
| `apps/web/src/components/article/block-registry.ts`     | `callout` を登録                                                                                         |
| `apps/web/src/components/article/ArticleRenderer.tsx`   | `callout` の子ブロックは1段下げずに渡す                                                                  |
| `packages/schema/**/*.test.ts` / `apps/*/**/*.test.tsx` | テストを追加                                                                                             |

## 実装メモ

- **props は `variant` だけにした。** BlockNote の独自ブロックは propSchema に書いた props だけを入れる（標準ブロックのように `backgroundColor` などが自動で付くわけではない）ことを、保存した JSON で確かめた。枠の色は `variant` で決まり、ブロックの文字色・背景色を持たせると枠の色とぶつかる。ウェブアプリは文字色・背景色・配置をどのブロックでも反映しないので、持たせても使い道が無い。持たせないので、ドラッグハンドルのメニューの「色」や配置のボタンも出ない
- **既定の種類は propSchema の `default: 'caution'` で決める。** スラッシュメニューからは `{ type: 'callout' }` だけで入れる
- **スラッシュメニューは `getDefaultReactSlashMenuItems` の引用（`key: 'quote'`）の直後に差し込む。** BlockNote のメニューは、続いている項目ごとにグループの見出しを出すため、末尾に足すと「基本ブロック」の見出しが2回出る。グループ名も引用の項目から取り、ロケールの文言と揃える
- **子ブロックを枠の中に出すため、枠は CSS で `.bn-block` に付けた。** BlockNote は子ブロック（`.bn-block-group`）をブロックの描画（`render`）の外、`.bn-block` の中の兄弟に置くので、React 側の要素に枠を付けると子ブロックが枠の外に出る。`.bn-block:has(> .react-renderer > .bn-block-content > [data-callout-variant])` で自分の子ブロックまで含めて囲み、`@apply` で Tailwind の色をそのまま使った（`>` で直下だけを見るので、入れ子の注意書きの色が親に移らない）
- **種類のメニューは BlockNote の `Components.Generic.Menu`（`@blocknote/shadcn` の DropdownMenu）で作った。** ドラッグハンドルのメニューと同じ見た目になり、`components/ui` に DropdownMenu を足さずに済む
- **メニューの項目に `checked` を渡さない。** 渡すとチェックボックスの項目になり、選んでもメニューが閉じなかった（実ブラウザで確認）。チェックは lucide の `Check` を項目の右に自前で出す
- **ウェブアプリの子ブロックは `ArticleRenderer` で1段下げずに渡す。** 他のブロックは子ブロックを `pl-6` の箱に入れて渡すが、枠の中でさらに下げると箇条書きが二重に下がって狭い画面で読みにくいため、1段下げないブロックの一覧（`unindentedChildren`）を持たせた
- **ウェブアプリの本文が空なら本文の行を出さない。** デザインの「注意事項」のように、見出しの下に箇条書きだけを置く使い方で空行ができないようにした（仕様書にも記載）
- 見出し・本文・子ブロックの文字色は種類の800、アイコンと箇条書きの点は700。デザインの 13px / 行間1.8 は `text-sm leading-6`、角丸14 は `rounded-xl`、padding 14,16 は `px-4 py-3` に寄せた（docs/conventions.md）
- 依存パッケージは足していない

## テスト

| テスト                                                     | 検証内容                                                                                                                                                                                      |
| ---------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `packages/schema/src/article.test.ts`                      | 3種類の受理、中身が空・子ブロック付き・JSON 経由の受理、`variant` の欠け・知らない値、知らない props（文字色・配置）、中身が無いときの拒否                                                    |
| `apps/web/src/components/article/ArticleRenderer.test.tsx` | 種類ごとの見出し・枠と文字の色クラス・本文、子ブロックを1段下げずに枠の中に出す、本文が空なら本文の行を出さない                                                                               |
| `apps/admin/components/editor/ArticleEditor.test.tsx`      | 許可するブロックに `callout` が入る、見出しと本文の表示、子ブロックが同じ `.bn-block` の中に入る、アイコンのメニューで種類を選ぶと props が変わり `onChange` に渡る、いまの種類にだけチェック |

```
bun run format    ✅
bun run lint      ✅
bun run typecheck ✅
bun run test      ✅
bun run build     ✅
```

e2e は画面の導線を変えていないので回していない。

### 動作確認（ローカル）

Playwright（headless Chromium）で、ログイン済みのセッションを入れ、API の返事を差し替えて確認した（fesp-dev にテスト用のデータを作らないため）。web は `--port 5185`、admin は `--port 3015` で立て、確認後に止めた。

- 管理者サイトで `/` を打つと、「基本ブロック」グループの引用のすぐ後ろに「注意書き」が出る（グループの見出しは1回だけ）
- 「注意書き」を選ぶと琥珀色の枠の「注意」が入り、そのまま本文を入力できる。Enter で次の段落に移り、Tab で注意書きの子ブロックになり、`- ` で箇条書きにすると枠の中に出る
- アイコンを押すとメニューが開き、いまの種類にチェックが付いている。「情報」を選ぶとメニューが閉じ、枠が緑・見出しが「情報」になる。「警告」も同様に赤になる
- 保存すると `PUT /api/articles/:id` の本文に `{ type: 'callout', props: { variant: 'warning' }, content: [...], children: [箇条書き] }` が入る
- ウェブアプリ（390px 幅）で、3種類の枠・アイコン・見出しがデザインどおりの色で出て、子ブロックの箇条書きが枠の中に出る
- コンソールエラーが出ない

## 詰まった点

- **種類のメニューが、選んでも閉じなかった。** `Menu.Item` に `checked` を渡すと base-ui のチェックボックスの項目になり、クリックで閉じない。`checked` を渡さず、チェックの印を自前で出して解決した
- **子ブロックが枠の外に出る。** 上の実装メモのとおり、BlockNote の DOM で子ブロックが `render` の外にあるため。CSS の `:has()` で `.bn-block` に枠を付けて解決した

## 残課題

- [ ] 模擬店の個別ページへの配置（#16 / #59）
- [ ] テンプレートによるロック（#64）
