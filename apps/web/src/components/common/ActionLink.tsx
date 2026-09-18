import type { ReactNode } from 'react'

import { cn } from '@fesp/ui'

/** 塗り。`primary` は水色に白い文字、`secondary` はグレーに濃い文字 */
const VARIANTS = {
    primary: 'bg-sky-500 text-white',
    secondary: 'bg-slate-100 text-slate-700',
}

export type ActionLinkProps = {
    href: string
    /** ラベルの左に出すアイコン */
    icon: ReactNode
    variant?: keyof typeof VARIANTS
    children: ReactNode
}

/**
 * サマリーの下に置く遷移のボタン（デザインの「アクション」）。丸いボタンにアイコンとラベルを横に並べる。
 * 模擬店・出演者のサマリーで使う
 */
export function ActionLink({ href, icon, variant = 'primary', children }: ActionLinkProps) {
    return (
        <a
            href={href}
            className={cn(
                'flex h-12 items-center justify-center gap-2 rounded-full text-sm font-semibold',
                VARIANTS[variant],
            )}
        >
            {icon}
            {children}
        </a>
    )
}
