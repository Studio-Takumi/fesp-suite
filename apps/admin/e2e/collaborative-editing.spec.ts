import { expect, test } from '@playwright/test'

/**
 * 同期編集の通しテスト（テンプレート）。
 * 2つのブラウザコンテキスト（= 別ユーザー）で同じルームを開き、
 * 片方の入力がもう片方に反映されることを確認する。
 *
 * 前提:
 *   - エディタを開く画面が実装されていること
 *   - PartyKit をローカル起動していること（`bun run dev --filter @fesp/realtime`）
 *   - 認証済みセッションを注入する仕組み（storageState）を用意すること
 */
test.skip(true, 'エディタ画面・Supabaseのテストユーザー・PartyKitのローカル起動が必要')

test('2クライアントで編集内容が同期される', async ({ browser }) => {
    const editorPath = '/' // エディタを開く画面のパスに差し替える

    const contextA = await browser.newContext()
    const contextB = await browser.newContext()
    const pageA = await contextA.newPage()
    const pageB = await contextB.newPage()

    await pageA.goto(editorPath)
    await pageB.goto(editorPath)

    const editorA = pageA.getByRole('textbox', { name: '本文エディタ' })
    const editorB = pageB.getByRole('textbox', { name: '本文エディタ' })

    await expect(pageA.getByText('同期中')).toBeVisible()
    await expect(pageB.getByText('同期中')).toBeVisible()

    await editorA.click()
    await editorA.fill('片方で入力した内容')

    await expect(editorB).toContainText('片方で入力した内容', { timeout: 10_000 })

    await contextA.close()
    await contextB.close()
})
