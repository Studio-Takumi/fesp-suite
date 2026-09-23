import { useQuery } from '@tanstack/react-query'
import { Link, useRouterState } from '@tanstack/react-router'
import { DynamicIcon, type IconName } from 'lucide-react/dynamic'

import { bottomNavsQuery } from '~/lib/queries'

import { iconNameToKebab, isCurrentNavItem } from './nav-items'

/**
 * 下のナビゲーションバー（デザインの共通パーツ `BottomNav`）。
 * 項目は管理者サイトから編集するので API から引き、`sort_order` の順に等幅で並べて、
 * 現在地の項目を水色で目立たせる。
 *
 * **項目が1つも無いときは、ナビ自体を描画しない**（読み込み中・取得に失敗したときも同じ）。
 * 枠だけが出ても来場者には意味が無く、本文を画面の下まで使えたほうがよいため
 */
export function BottomNav() {
    const pathname = useRouterState({ select: (state) => state.location.pathname })
    const navs = useQuery(bottomNavsQuery())

    const items = navs.data?.items ?? []
    if (items.length === 0) return null

    return (
        // ホームバーぶんの余白。Tailwind のスケールでは書けないので任意値を使う
        <nav
            aria-label='メインメニュー'
            className='sticky bottom-0 border-t border-slate-200 bg-white pb-[env(safe-area-inset-bottom)]'
        >
            <ul className='mx-auto flex max-w-3xl px-2 pt-3 pb-2 md:max-w-6xl'>
                {items.map((item) => {
                    const isCurrent = isCurrentNavItem(pathname, item.href)
                    const color = isCurrent ? 'text-sky-500' : 'text-slate-400'

                    return (
                        <li key={item.id} className='flex-1'>
                            <Link
                                to={item.href}
                                aria-current={isCurrent ? 'page' : undefined}
                                className={`flex flex-col items-center gap-1 ${color}`}
                            >
                                {/*
                                 * アイコンは lucide のどれでも選べるので、必要なものだけを読み込む。
                                 * 定義に無い名前のときは何も出さず、ラベルと移動先はそのまま出す
                                 * （1件の設定ミスでナビが壊れないようにするため）
                                 */}
                                <DynamicIcon
                                    name={iconNameToKebab(item.icon) as IconName}
                                    size={24}
                                    aria-hidden
                                    fallback={() => null}
                                />
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
