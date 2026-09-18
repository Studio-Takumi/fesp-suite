import { useQuery } from '@tanstack/react-query'
import { ChevronRight } from 'lucide-react'

import { dateFormatter } from '@fesp/ui'

import { weatherKinds } from '~/components/weather/weather-kinds'
import { weatherQuery } from '~/lib/queries'

import type { BlockComponentProps } from '../block-registry'

/**
 * 日付・天気の帯（独自コンポーネント `weatherBar`）。今日の日付・天気・最高/最低気温を1行で出し、押すと天気のページへ移動する。
 * 天気のデータは天気のブロック（`todayWeather` など）と同じものを読む。読み込み中・失敗したときは何も出さない
 */
export function WeatherBar({ children }: BlockComponentProps) {
    const { data } = useQuery(weatherQuery())
    const today = data?.today
    const kind = today ? weatherKinds[today.weather] : undefined
    // 日付（`YYYY-MM-DD`）は日本時間の日付なので、日本時間の0時として読む
    const day = today ? new Date(`${today.date}T00:00:00+09:00`) : undefined

    return (
        <>
            {today && kind && day && (
                <a
                    href='/weather'
                    className='-mx-4 flex items-center justify-between border-b border-slate-200 px-4 py-3'
                >
                    <span className='flex items-end gap-1'>
                        <span className='text-2xl leading-none font-medium text-slate-900'>
                            {dateFormatter(day, 'M/D')}
                        </span>
                        <span className='text-xs text-slate-500'>({dateFormatter(day, 'EEE')})</span>
                    </span>
                    <span className='flex items-center gap-3'>
                        <kind.Icon size={26} className={kind.className} aria-hidden />
                        <span className='sr-only'>{kind.label}</span>
                        <span className='flex items-center gap-1'>
                            <span className='sr-only'>最高</span>
                            <span className='font-medium text-rose-500'>{today.maxTemperature}°</span>
                            <span className='text-sm text-slate-300'>/</span>
                            <span className='sr-only'>最低</span>
                            <span className='font-medium text-sky-500'>{today.minTemperature}°</span>
                        </span>
                    </span>
                    <ChevronRight size={18} className='text-slate-400' aria-hidden />
                </a>
            )}
            {children}
        </>
    )
}
