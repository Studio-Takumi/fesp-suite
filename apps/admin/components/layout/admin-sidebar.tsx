'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

import {
    CalendarDays,
    ChevronsUpDown,
    CloudSun,
    Ellipsis,
    House,
    LayoutDashboard,
    type LucideIcon,
    Map,
    Megaphone,
    Music,
    Newspaper,
    PanelLeft,
    PanelLeftClose,
    Settings,
    ShieldCheck,
    Store,
    ToggleRight,
} from 'lucide-react'

import { cn } from '~/lib/utils'
import { useAdminUiStore } from '~/stores/ui'

type NavItem = {
    label: string
    href: string
    icon: LucideIcon
    implemented?: boolean
}

type NavGroup = {
    heading?: string
    items: NavItem[]
}

/** メニュー項目の唯一の定義。ページが増えたらここに足す */
const navGroups: NavGroup[] = [
    {
        items: [
            { label: 'ダッシュボード', href: '/', icon: LayoutDashboard, implemented: true },
            { label: '基本設定', href: '/settings', icon: Settings },
            { label: '機能オン・オフ', href: '/features', icon: ToggleRight },
        ],
    },
    {
        heading: '情報発信',
        items: [
            { label: 'ホーム', href: '/home', icon: House },
            { label: 'ニュース', href: '/news', icon: Megaphone },
            { label: 'ブログ', href: '/blogs', icon: Newspaper },
            { label: 'スケジュール', href: '/schedule', icon: CalendarDays },
            { label: 'マップ', href: '/map', icon: Map },
            { label: '天気', href: '/weather', icon: CloudSun },
            { label: '模擬店', href: '/shops', icon: Store },
            { label: '出演者', href: '/artists', icon: Music },
        ],
    },
    {
        heading: '運営',
        items: [{ label: '権限設定', href: '/permissions', icon: ShieldCheck }],
    },
]

export function AdminSidebar() {
    const pathname = usePathname()
    const isOpen = useAdminUiStore((state) => state.isSidebarOpen)
    const toggleSidebar = useAdminUiStore((state) => state.toggleSidebar)

    return (
        <aside
            className={cn(
                'flex h-screen shrink-0 flex-col border-r border-border bg-slate-50 transition-[width]',
                isOpen ? 'w-[248px]' : 'w-16',
            )}
        >
            <div
                className={cn(
                    'flex items-center gap-2.5 border-b border-border p-3.5',
                    !isOpen && 'justify-center px-2',
                )}
            >
                <div className='flex size-[34px] shrink-0 items-center justify-center rounded-[9px] bg-sky-500'>
                    <span className='text-[17px] font-bold text-white'>F</span>
                </div>
                {isOpen ? (
                    <>
                        <div className='min-w-0 flex-1'>
                            <p className='truncate text-[13px] font-semibold text-slate-900'>あおば高校 文化祭</p>
                            <p className='truncate text-[11px] text-slate-400'>無料プラン</p>
                        </div>
                        <ChevronsUpDown className='size-[15px] shrink-0 text-slate-400' />
                    </>
                ) : null}
            </div>

            <nav aria-label='管理者メニュー' className='flex-1 space-y-0.5 overflow-y-auto p-2.5'>
                {navGroups.map((group, index) => (
                    <div key={group.heading ?? index}>
                        {group.heading && isOpen ? (
                            <p className='px-2.5 pt-3.5 pb-1.5 text-[11px] font-semibold tracking-wide text-slate-400'>
                                {group.heading}
                            </p>
                        ) : null}
                        {group.items.map((item) => {
                            const isActive = item.href === '/' ? pathname === '/' : pathname.startsWith(item.href)
                            const Icon = item.icon

                            if (!item.implemented) {
                                return (
                                    <div
                                        key={item.href}
                                        aria-disabled='true'
                                        title={!isOpen ? item.label : undefined}
                                        className={cn(
                                            'flex cursor-not-allowed items-center gap-2.5 rounded-lg px-2.5 py-2 text-slate-300',
                                            !isOpen && 'justify-center px-2',
                                        )}
                                    >
                                        <Icon className='size-[17px] shrink-0' />
                                        {isOpen ? (
                                            <>
                                                <span className='flex-1 truncate text-[13px]'>{item.label}</span>
                                                <span className='shrink-0 rounded-full bg-slate-100 px-1.5 py-px text-[10px] text-slate-400'>
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
                                        'flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-slate-700 hover:bg-slate-100',
                                        isActive && 'bg-sky-100 font-semibold text-sky-500 hover:bg-sky-100',
                                        !isOpen && 'justify-center px-2',
                                    )}
                                >
                                    <Icon
                                        className={cn(
                                            'size-[17px] shrink-0',
                                            isActive ? 'text-sky-500' : 'text-slate-500',
                                        )}
                                    />
                                    {isOpen ? <span className='truncate text-[13px]'>{item.label}</span> : null}
                                </Link>
                            )
                        })}
                    </div>
                ))}
            </nav>

            <div className='border-t border-border p-2.5'>
                <button
                    type='button'
                    onClick={toggleSidebar}
                    aria-label={isOpen ? 'サイドメニューを閉じる' : 'サイドメニューを開く'}
                    className={cn(
                        'flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-slate-500 hover:bg-slate-100',
                        !isOpen && 'justify-center px-2',
                    )}
                >
                    {isOpen ? (
                        <PanelLeftClose className='size-[17px] shrink-0' />
                    ) : (
                        <PanelLeft className='size-[17px] shrink-0' />
                    )}
                    {isOpen ? <span className='text-[13px]'>折りたたむ</span> : null}
                </button>
            </div>

            <div
                className={cn('flex items-center gap-2.5 border-t border-border p-3', !isOpen && 'justify-center px-2')}
            >
                <div className='flex size-[30px] shrink-0 items-center justify-center rounded-full bg-sky-100'>
                    <span className='text-[13px] font-semibold text-sky-500'>T</span>
                </div>
                {isOpen ? (
                    <>
                        <div className='min-w-0 flex-1'>
                            <p className='truncate text-xs font-medium text-slate-900'>岩崎 拓海</p>
                            <p className='truncate text-[10px] text-slate-400'>管理者</p>
                        </div>
                        <Ellipsis className='size-[15px] shrink-0 text-slate-400' />
                    </>
                ) : null}
            </div>
        </aside>
    )
}
