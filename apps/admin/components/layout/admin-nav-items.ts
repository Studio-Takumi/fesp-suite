import {
    CalendarDays,
    CalendarRange,
    CloudSun,
    House,
    LayoutDashboard,
    type LucideIcon,
    Map,
    MapPin,
    Megaphone,
    Music,
    Newspaper,
    Settings,
    ShieldCheck,
    Store,
    Tags,
    ToggleRight,
} from 'lucide-react'

export type NavItem = {
    label: string
    href: string
    icon: LucideIcon
    implemented?: boolean
    /** 下位項目。親の下に字下げして出す。親が準備中でも下位項目は開ける */
    children?: NavItem[]
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
            {
                label: 'ニュース',
                href: '/news',
                icon: Megaphone,
                children: [{ label: 'タグ', href: '/news/tags', icon: Tags, implemented: true }],
            },
            { label: 'ブログ', href: '/blogs', icon: Newspaper },
            {
                label: 'スケジュール',
                href: '/schedule',
                icon: CalendarDays,
                children: [{ label: '開催日', href: '/schedule/event-days', icon: CalendarRange, implemented: true }],
            },
            {
                label: 'マップ',
                href: '/map',
                icon: Map,
                children: [{ label: '場所', href: '/map/places', icon: MapPin, implemented: true }],
            },
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
