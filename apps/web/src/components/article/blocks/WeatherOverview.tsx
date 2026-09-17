import { useQuery } from '@tanstack/react-query'

import { weatherQuery } from '~/lib/queries'

import type { BlockComponentProps } from '../block-registry'

/**
 * 天気概況（独自コンポーネント `weatherOverview`）。気象台の天気概況の文章を、改行を残して出す。
 * 読み込み中・失敗したとき・文章が空のときは何も出さない
 */
export function WeatherOverview({ block, children }: BlockComponentProps) {
    const { data } = useQuery(weatherQuery())
    const headingId = `weather-overview-${block.id}`

    return (
        <>
            {data?.overview && (
                <section aria-labelledby={headingId} className='flex flex-col gap-2'>
                    <h2 id={headingId} className='text-base font-bold text-slate-900'>
                        今日の天気概況
                    </h2>
                    <p className='text-sm leading-loose whitespace-pre-line text-slate-700'>{data.overview}</p>
                </section>
            )}
            {children}
        </>
    )
}
