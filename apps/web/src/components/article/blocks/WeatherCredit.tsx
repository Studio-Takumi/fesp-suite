import { useQuery } from '@tanstack/react-query'
import { RefreshCw } from 'lucide-react'

import { dateFormatter } from '@fesp/ui'

import { weatherQuery } from '~/lib/queries'

import type { BlockComponentProps } from '../block-registry'

/**
 * 天気の更新時刻・出典（独自コンポーネント `weatherCredit`）。「11:10 更新 ・ 出典: 気象庁」。
 * 読み込み中・失敗したときは何も出さない
 */
export function WeatherCredit({ children }: BlockComponentProps) {
    const { data } = useQuery(weatherQuery())

    return (
        <>
            {data && (
                <p className='flex items-center gap-2 border-t border-slate-200 pt-3 text-xs text-slate-400'>
                    <RefreshCw size={12} aria-hidden />
                    {dateFormatter(data.updatedAt, 'HH:mm')} 更新 ・ 出典: 気象庁
                </p>
            )}
            {children}
        </>
    )
}
