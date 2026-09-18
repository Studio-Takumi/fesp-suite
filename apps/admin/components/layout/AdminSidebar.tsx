'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

import { ChevronsUpDown, LogOut, PanelLeft, PanelLeftClose } from 'lucide-react'

import { supabase } from '~/lib/supabase'
import { cn } from '~/lib/utils'
import { useAdminUiStore } from '~/stores/ui'

import { useSession } from '../auth/session-context'
import { navGroups } from './admin-nav-items'

const ICON_SIZE = 20

export function AdminSidebar() {
    const pathname = usePathname()
    const isOpen = useAdminUiStore((state) => state.isSidebarOpen)
    const toggleSidebar = useAdminUiStore((state) => state.toggleSidebar)
    const email = useSession()?.user.email ?? ''

    // 移動とキャッシュの破棄は AuthGuard が SIGNED_OUT を受けて行う。
    // global にすると他の端末・ウェブアプリのログインまで切れるので、この端末のセッションだけ終える
    const signOut = () => void supabase.auth.signOut({ scope: 'local' })

    return (
        <aside
            className={cn(
                'flex h-screen shrink-0 flex-col border-r border-border bg-slate-50 transition-all',
                isOpen ? 'w-64' : 'w-16',
            )}
        >
            <div
                className={cn('flex h-16 items-center gap-2 border-b border-border px-3', !isOpen && 'justify-center')}
            >
                <div className='flex size-9 shrink-0 items-center justify-center rounded-lg bg-sky-500'>
                    <span className='text-base font-bold text-white'>F</span>
                </div>
                {isOpen ? (
                    <>
                        <div className='min-w-0 flex-1'>
                            <p className='truncate text-sm font-semibold text-slate-900'>あおば高校 文化祭</p>
                            <p className='truncate text-xs text-slate-400'>無料プラン</p>
                        </div>
                        <ChevronsUpDown size={ICON_SIZE} className='shrink-0 text-slate-400' />
                    </>
                ) : null}
            </div>

            <nav aria-label='管理者メニュー' className='flex-1 space-y-1 overflow-y-auto p-3'>
                {navGroups.map((group, index) => (
                    <div key={group.heading ?? index}>
                        {group.heading && isOpen ? (
                            <p className='px-3 pt-4 pb-2 text-xs font-semibold tracking-wide text-slate-400'>
                                {group.heading}
                            </p>
                        ) : null}
                        {group.items.map((item) => {
                            const isActive = item.href === '/' ? pathname === '/' : pathname.startsWith(item.href)
                            const Icon = item.icon
                            const itemLayout = isOpen ? 'h-10 gap-2 px-3' : 'mx-auto h-10 w-10 justify-center'

                            if (!item.implemented) {
                                return (
                                    <div
                                        key={item.href}
                                        aria-disabled='true'
                                        title={!isOpen ? item.label : undefined}
                                        className={cn(
                                            'flex cursor-not-allowed items-center rounded-lg text-slate-300',
                                            itemLayout,
                                        )}
                                    >
                                        <Icon size={ICON_SIZE} className='shrink-0' />
                                        {isOpen ? (
                                            <>
                                                <span className='flex-1 truncate text-sm'>{item.label}</span>
                                                <span className='shrink-0 rounded-full bg-slate-100 px-2 py-px text-xs text-slate-400'>
                                                    準備中
                                                </span>
                                            </>
                                        ) : null}
                                    </div>
                                )
                            }

                            return (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    aria-current={isActive ? 'page' : undefined}
                                    title={!isOpen ? item.label : undefined}
                                    className={cn(
                                        'flex items-center rounded-lg text-slate-700 hover:bg-slate-100',
                                        itemLayout,
                                        isActive && 'bg-sky-100 font-semibold text-sky-500 hover:bg-sky-100',
                                    )}
                                >
                                    <Icon
                                        size={ICON_SIZE}
                                        className={cn('shrink-0', isActive ? 'text-sky-500' : 'text-slate-500')}
                                    />
                                    {isOpen ? <span className='truncate text-sm'>{item.label}</span> : null}
                                </Link>
                            )
                        })}
                    </div>
                ))}
            </nav>

            <div className='border-t border-border p-3'>
                <button
                    type='button'
                    onClick={toggleSidebar}
                    aria-label={isOpen ? 'サイドメニューを閉じる' : 'サイドメニューを開く'}
                    className={cn(
                        'flex items-center rounded-lg text-slate-500 hover:bg-slate-100',
                        isOpen ? 'h-10 w-full gap-2 px-3' : 'mx-auto h-10 w-10 justify-center',
                    )}
                >
                    {isOpen ? <PanelLeftClose size={ICON_SIZE} /> : <PanelLeft size={ICON_SIZE} />}
                    {isOpen ? <span className='text-sm'>たたむ</span> : null}
                </button>
            </div>

            <div
                className={cn('flex h-16 items-center gap-2 border-t border-border px-3', !isOpen && 'justify-center')}
            >
                {isOpen ? (
                    <>
                        <div className='flex size-8 shrink-0 items-center justify-center rounded-full bg-sky-100'>
                            <span className='text-sm font-semibold text-sky-500'>{email.charAt(0).toUpperCase()}</span>
                        </div>
                        <p className='min-w-0 flex-1 truncate text-xs font-medium text-slate-900'>{email}</p>
                    </>
                ) : null}
                <button
                    type='button'
                    onClick={signOut}
                    aria-label='ログアウト'
                    title='ログアウト'
                    className='flex size-8 shrink-0 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700'
                >
                    <LogOut size={ICON_SIZE} />
                </button>
            </div>
        </aside>
    )
}
