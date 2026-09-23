import { CalendarDays, Map as MapIcon } from 'lucide-react'

import { ActionLink } from '~/components/common/ActionLink'

import type { BlockComponentProps } from '../block-registry'

/**
 * 出演者のアクション（独自コンポーネント `artistActions`）。出演者のページからスケジュール・マップへ
 * 移動する「スケジュールで見る」「会場をマップで見る」ボタンを出す。props は持たない
 */
export function ArtistActions({ children }: BlockComponentProps) {
    return (
        <>
            <section aria-label='出演者のアクション' className='flex flex-col gap-3'>
                <ActionLink href='/schedule' icon={<CalendarDays size={18} aria-hidden />}>
                    スケジュールで見る
                </ActionLink>
                <ActionLink href='/map' icon={<MapIcon size={18} aria-hidden />} variant='secondary'>
                    会場をマップで見る
                </ActionLink>
            </section>
            {children}
        </>
    )
}
