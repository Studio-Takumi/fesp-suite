import { Link, Outlet } from '@tanstack/react-router'
import { Settings } from 'lucide-react'

/** 共通レイアウト（モバイルファースト）。ナビの項目は実装時に足す */
export function AppShell() {
    return (
        <div className='flex min-h-dvh flex-col'>
            <header className='sticky top-0 z-10 border-b border-border bg-background/90 backdrop-blur'>
                <div className='mx-auto flex h-14 max-w-3xl items-center justify-between px-4'>
                    <Link to='/' className='font-bold'>
                        ウェブアプリ
                    </Link>
                    <Link to='/settings' aria-label='設定' className='text-muted-foreground hover:text-foreground'>
                        <Settings size={20} />
                    </Link>
                </div>
            </header>

            <main className='mx-auto w-full max-w-3xl flex-1 px-4 py-6'>
                <Outlet />
            </main>
        </div>
    )
}
