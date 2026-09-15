import type { Metadata } from 'next'
import type { ReactNode } from 'react'

import './globals.css'
import { Providers } from './Providers'

export const metadata: Metadata = {
    title: {
        default: '管理者ページ',
        template: '%s | 管理者ページ',
    },
    description: '文化祭ポータルの編集画面',
    robots: { index: false, follow: false },
}

export default function RootLayout({ children }: { children: ReactNode }) {
    return (
        <html lang='ja' suppressHydrationWarning>
            <body>
                <Providers>{children}</Providers>
            </body>
        </html>
    )
}
