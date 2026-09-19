import { Link, useRouterState } from '@tanstack/react-router'

import { isCurrentNavItem, navItems } from './nav-items'

/**
 * 下のナビゲーションバー（デザインの共通パーツ `BottomNav`）。
 * 主要なページへの導線を等幅で並べ、現在地の項目を水色で目立たせる
 */
export function BottomNav() {
    const pathname = useRouterState({ select: (state) => state.location.pathname })

    return (
        // ホームバーぶんの余白。Tailwind のスケールでは書けないので任意値を使う
        <nav
            aria-label='メインメニュー'
            className='sticky bottom-0 border-t border-slate-200 bg-white pb-[env(safe-area-inset-bottom)]'
        >
            <ul className='mx-auto flex max-w-3xl px-2 pt-3 pb-2 md:max-w-6xl'>
                {navItems.map((item) => {
                    const Icon = item.icon
                    const isCurrent = isCurrentNavItem(pathname, item.href)
                    const color = isCurrent ? 'text-sky-500' : 'text-slate-400'

                    return (
                        <li key={item.href} className='flex-1'>
                            <Link
                                to={item.href}
                                aria-current={isCurrent ? 'page' : undefined}
                                className={`flex flex-col items-center gap-1 ${color}`}
                            >
                                <Icon size={24} aria-hidden />
                                {/* ラベルは10px。Tailwind のスケールに無い大きさなので任意値を使う */}
                                <span className='text-[10px] leading-tight'>{item.label}</span>
                            </Link>
                        </li>
                    )
                })}
            </ul>
        </nav>
    )
}
