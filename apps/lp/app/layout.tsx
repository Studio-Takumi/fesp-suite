import type { Metadata, Viewport } from 'next'
import type { ReactNode } from 'react'

import './globals.css'

// サービス名が決まったらここを差し替える
export const metadata: Metadata = {
    title: {
        default: 'LPサイト',
        template: '%s | LPサイト',
    },
    description: 'サービス紹介ページ',
    openGraph: {
        type: 'website',
        locale: 'ja_JP',
    },
}

export const viewport: Viewport = {
    themeColor: [
        { media: '(prefers-color-scheme: light)', color: '#ffffff' },
        { media: '(prefers-color-scheme: dark)', color: '#111111' },
    ],
}

export default function RootLayout({ children }: { children: ReactNode }) {
    return (
        <html lang='ja' suppressHydrationWarning>
            <body>{children}</body>
        </html>
    )
}
