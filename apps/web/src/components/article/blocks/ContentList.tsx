import { CalendarDays, ClipboardList, CloudSun, type LucideIcon, MapIcon, Music, Newspaper, Store } from 'lucide-react'

import { type ContentListIcon, contentListPropsSchema, parseContentListLinks } from '@fesp/schema'

import type { BlockComponentProps } from '../block-registry'

/** リンクに選べるアイコン（`contentListIcons`）→ lucide のコンポーネント */
const contentListIconComponents: Record<ContentListIcon, LucideIcon> = {
    'calendar-days': CalendarDays,
    map: MapIcon,
    store: Store,
    music: Music,
    newspaper: Newspaper,
    'cloud-sun': CloudSun,
    'clipboard-list': ClipboardList,
}

/**
 * その他のコンテンツ（独自コンポーネント `contentList`）。各ページへのリンクを2列のグリッドで並べる。
 * リンクが1件も無ければ何も出さない
 */
export function ContentList({ block, children }: BlockComponentProps) {
    // 記事は取得時に検証済みだが、型は `Record<string, unknown>` なのでここで props の型にする
    const props = contentListPropsSchema.safeParse(block.props)
    const links = props.success ? parseContentListLinks(props.data.links) : []
    const headingId = `content-list-${block.id}`

    return (
        <>
            {links.length > 0 && (
                <section aria-labelledby={headingId} className='flex flex-col gap-2'>
                    <h2 id={headingId} className='text-base font-bold text-slate-900'>
                        その他のコンテンツ
                    </h2>
                    <ul className='grid grid-cols-2 gap-3'>
                        {links.map((link, index) => {
                            const Icon = contentListIconComponents[link.icon]
                            return (
                                <li key={`${index}-${link.href}`}>
                                    <a href={link.href} className='flex items-center gap-3 rounded-xl bg-slate-50 p-4'>
                                        <Icon size={20} className='shrink-0 text-sky-500' aria-hidden />
                                        <span className='text-sm font-medium text-slate-900'>{link.label}</span>
                                    </a>
                                </li>
                            )
                        })}
                    </ul>
                </section>
            )}
            {children}
        </>
    )
}
