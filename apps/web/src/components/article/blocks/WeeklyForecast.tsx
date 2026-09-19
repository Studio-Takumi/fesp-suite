import { useQuery } from '@tanstack/react-query'

import { dateFormatter } from '@fesp/ui'

import { weatherKinds } from '~/components/weather/weather-kinds'
import { weatherQuery } from '~/lib/queries'

import type { BlockComponentProps } from '../block-registry'

const DAY = 24 * 60 * 60 * 1000

/** 日付（日本時間の `YYYY-MM-DD`）の見出し。今日・明日はそう出し、それ以外は `15(土)` の形にする */
function dayLabel(date: string, now: Date): string {
    if (date === dateFormatter(now, 'YYYY-MM-DD')) return '今日'
    if (date === dateFormatter(new Date(now.getTime() + DAY), 'YYYY-MM-DD')) return '明日'

    const day = new Date(`${date}T00:00:00+09:00`)
    return `${Number(dateFormatter(day, 'DD'))}(${dateFormatter(day, 'EEE')})`
}

/**
 * 週間予報（独自コンポーネント `weeklyForecast`）。1日1枚のカードを横に並べ、はみ出す分は横にスクロールする。
 * 読み込み中・失敗したとき・予報が無いときは何も出さない
 */
export function WeeklyForecast({ block, children }: BlockComponentProps) {
    const { data } = useQuery(weatherQuery())
    const now = new Date()
    const headingId = `weekly-forecast-${block.id}`

    return (
        <>
            {data && data.weekly.length > 0 && (
                <section aria-labelledby={headingId} className='flex flex-col gap-2'>
                    <h2 id={headingId} className='text-base font-bold text-slate-900'>
                        週間予報
                    </h2>
                    {/* 読み上げ用の文字（sr-only は absolute）がスクロールの外にはみ出してページを広げないよう relative にする */}
                    <ul className='relative flex gap-2 overflow-x-auto'>
                        {data.weekly.map((forecast) => {
                            const kind = weatherKinds[forecast.weather]
                            return (
                                <li
                                    key={forecast.date}
                                    className='flex w-18 shrink-0 flex-col items-center gap-2 rounded-lg bg-slate-50 py-3'
                                >
                                    <span className='text-xs font-semibold text-slate-400'>
                                        {dayLabel(forecast.date, now)}
                                    </span>
                                    <kind.Icon size={26} className={kind.className} aria-hidden />
                                    <span className='sr-only'>{kind.label}</span>
                                    <span className='flex gap-1 text-sm'>
                                        <span className='sr-only'>最高</span>
                                        <span className='font-semibold text-rose-500'>{forecast.maxTemperature}</span>
                                        <span className='sr-only'>最低</span>
                                        <span className='text-sky-500'>{forecast.minTemperature}</span>
                                    </span>
                                    <span className='text-xs text-slate-400'>
                                        <span className='sr-only'>降水確率</span>
                                        {forecast.precipitationProbability}%
                                    </span>
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
