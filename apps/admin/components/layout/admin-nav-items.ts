import {
    CalendarDays,
    CloudSun,
    House,
    LayoutDashboard,
    type LucideIcon,
    Map,
    Megaphone,
    Music,
    Newspaper,
    Settings,
    ShieldCheck,
    Store,
    ToggleRight,
} from 'lucide-react'

export type NavItem = {
    label: string
    href: string
    icon: LucideIcon
    implemented?: boolean
}

export type NavGroup = {
    heading?: string
    items: NavItem[]
}

/** メニュー項目の唯一の定義。ページが増えたらここに足す */
export const navGroups: NavGroup[] = [
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
