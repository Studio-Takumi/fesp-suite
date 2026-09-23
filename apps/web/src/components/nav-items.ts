/**
 * 下のナビゲーションバー（`BottomNav`）の現在地の判定と、アイコン名の変換。
 * 項目そのものは管理者サイトから編集するので、コードには持たず API（`bottomNavsQuery`）から引く
 */

/**
 * いま開いているパス（`pathname`）が項目の現在地かどうか。
 * `/` はちょうど一致するときだけ。それ以外は前方一致で、個別ページ（`/news/1` など）も元の項目を現在地にする
 */
export function isCurrentNavItem(pathname: string, href: string): boolean {
    if (href === '/') return pathname === '/'
    return pathname === href || pathname.startsWith(`${href}/`)
}

/**
 * lucide のアイコン名（`CalendarDays`）を、`DynamicIcon` が受け取るケバブケース（`calendar-days`）にする。
 * DB には `docs/api.md` のとおり PascalCase で持つので、描画のときにここで変換する
 */
export function iconNameToKebab(name: string): string {
    return name
        .replace(/([A-Z]+)([A-Z][a-z])/g, '$1-$2')
        .replace(/([a-z0-9])([A-Z])/g, '$1-$2')
        .toLowerCase()
}
