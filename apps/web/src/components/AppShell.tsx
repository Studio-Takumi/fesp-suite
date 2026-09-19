import { Outlet } from '@tanstack/react-router'

import { BottomNav } from './BottomNav'

/**
 * 共通レイアウト（モバイルファースト）。上にヘッダーは置かず、下にナビゲーションバーを出す。
 * `md` 以上では画面の高さに収め、ページ全体ではなく本文の領域をスクロールさせる
 * （2ペインの左右を独立してスクロールさせるため。docs/app.md）
 */
export function AppShell() {
    return (
        <div className='flex min-h-dvh flex-col md:h-dvh'>
            <main className='mx-auto w-full max-w-3xl flex-1 px-4 md:min-h-0 md:max-w-6xl md:overflow-y-auto'>
                <Outlet />
            </main>

            <BottomNav />
        </div>
    )
}
