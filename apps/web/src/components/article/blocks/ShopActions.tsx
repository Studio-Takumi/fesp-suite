import { MapIcon } from 'lucide-react'

import { ActionLink } from '~/components/common/ActionLink'

import type { BlockComponentProps } from '../block-registry'

/**
 * 模擬店のアクション（独自コンポーネント `shopActions`）。模擬店のページからマップへ移動する
 * 「マップで見る」ボタンを出す。props は持たない
 */
export function ShopActions({ children }: BlockComponentProps) {
    return (
        <>
            <section aria-label='模擬店のアクション' className='flex flex-col gap-3'>
                <ActionLink href='/map' icon={<MapIcon size={18} aria-hidden />}>
                    マップで見る
                </ActionLink>
            </section>
            {children}
        </>
    )
}
