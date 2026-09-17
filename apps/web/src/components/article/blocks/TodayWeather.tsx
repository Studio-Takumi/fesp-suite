import { useQuery } from '@tanstack/react-query'

import { weatherKinds } from '~/components/weather/weather-kinds'
import { weatherQuery } from '~/lib/queries'

import type { BlockComponentProps } from '../block-registry'

/**
 * 今日の天気（独自コンポーネント `todayWeather`）。天気のアイコンと、現在・最高・最低の気温と降水確率。
 * 読み込み中・失敗したときは何も出さない
 */
export function TodayWeather({ children }: BlockComponentProps) {
    const { data } = useQuery(weatherQuery())
    const today = data?.today
    const kind = today ? weatherKinds[today.weather] : undefined

    return (
        <>
            {today && kind && (
                <section aria-label='今日の天気' className='flex items-center gap-4 rounded-2xl bg-sky-50 p-5'>
                    <kind.Icon size={72} className={kind.className} aria-hidden />
                    <div className='flex min-w-0 flex-1 flex-col gap-1'>
                        <p className='flex items-end gap-1'>
                            <span className='sr-only'>{kind.label} 現在の気温</span>
                            <span className='text-5xl leading-none font-extralight text-slate-900'>
                                {today.temperature}
                            </span>
                            <span className='text-lg text-slate-500'>°C</span>
                        </p>
                        <dl className='flex flex-wrap items-center gap-3'>
                            <div className='flex items-baseline gap-1'>
                                <dt className='text-xs text-slate-400'>最高</dt>
                                <dd className='text-sm font-semibold text-rose-500'>{today.maxTemperature}°</dd>
                            </div>
                            <div className='flex items-baseline gap-1'>
                                <dt className='text-xs text-slate-400'>最低</dt>
                                <dd className='text-sm font-semibold text-sky-500'>{today.minTemperature}°</dd>
                            </div>
                            <div className='flex items-baseline gap-1'>
                                <dt className='text-xs text-slate-400'>降水</dt>
                                <dd className='text-sm font-semibold text-slate-700'>
                                    {today.precipitationProbability}%
                                </dd>
                            </div>
                        </dl>
                    </div>
                </section>
            )}
            {children}
        </>
    )
}
