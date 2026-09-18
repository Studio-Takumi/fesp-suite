import { Bell, CalendarDays, House, type LucideIcon, MapIcon } from 'lucide-react'

export type NavItem = {
    label: string
    /** 移動先のパス */
    href: string
    icon: LucideIcon
}

/**
 * 下のナビゲーションバー（`BottomNav`）の項目の唯一の定義。
 * 管理者サイトから編集できるようにするのは #93。それまではここに持つ
 */
export const navItems: NavItem[] = [
    { label: 'ホーム', href: '/', icon: House },
    { label: 'お知らせ', href: '/news', icon: Bell },
    { label: 'マップ', href: '/map', icon: MapIcon },
    { label: 'スケジュール', href: '/schedule', icon: CalendarDays },
]

/**
 * いま開いているパス（`pathname`）が項目の現在地かどうか。
 * `/` はちょうど一致するときだけ。それ以外は前方一致で、個別ページ（`/news/1` など）も元の項目を現在地にする
 */
export function isCurrentNavItem(pathname: string, href: string): boolean {
    if (href === '/') return pathname === '/'
    return pathname === href || pathname.startsWith(`${href}/`)
}
