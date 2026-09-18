import { Outlet } from '@tanstack/react-router'

import { BottomNav } from './BottomNav'

/** 共通レイアウト（モバイルファースト）。上にヘッダーは置かず、下にナビゲーションバーを出す */
export function AppShell() {
    return (
        <div className='flex min-h-dvh flex-col'>
            <main className='mx-auto w-full max-w-3xl flex-1 px-4'>
                <Outlet />
            </main>

            <BottomNav />
        </div>
    )
}
