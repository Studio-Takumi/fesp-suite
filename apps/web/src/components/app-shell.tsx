import { Link, Outlet } from '@tanstack/react-router'

/** 共通レイアウト（モバイルファースト）。ナビの項目は実装時に足す */
export function AppShell() {
    return (
        <div className='flex min-h-dvh flex-col'>
            <header className='sticky top-0 z-10 border-b border-border bg-background/90 backdrop-blur'>
                <div className='mx-auto flex h-14 max-w-3xl items-center px-4'>
                    <Link to='/' className='font-bold'>
                        ウェブアプリ
                    </Link>
                </div>
            </header>

            <main className='mx-auto w-full max-w-3xl flex-1 px-4 py-6'>
                <Outlet />
            </main>
        </div>
    )
}
