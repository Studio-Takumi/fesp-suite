import { useState } from 'react'

import { useQuery } from '@tanstack/react-query'

import { dateFormatter } from '@fesp/ui'

import { EmptyState } from '~/components/EmptyState'
import { DateTabs } from '~/components/list/DateTabs'
import { QueryBoundary } from '~/components/QueryBoundary'
import type { ScheduleDay } from '~/lib/mock/schedule'
import { scheduleQuery } from '~/lib/queries'

import type { BlockComponentProps } from '../block-registry'

/** 1時間の高さ（px）。時刻の行の `h-20` と揃える */
const HOUR_HEIGHT = 80

/** 日本時間の 0:00 からの分 */
const minutesOfDay = (timestamp: string) =>
    Number(dateFormatter(timestamp, 'H')) * 60 + Number(dateFormatter(timestamp, 'mm'))

/**
 * スケジュール表（独自コンポーネント `scheduleTable`）。日付タブ・会場ヘッダー・時間のグリッド。
 * `showDateTabs` が `false` なら日付タブを出さず、1日目を出す
 */
export function ScheduleTable({ block, children }: BlockComponentProps) {
    const showDateTabs = block.props.showDateTabs !== false
    const schedule = useQuery(scheduleQuery())
    const [selectedIndex, setSelectedIndex] = useState(0)

    return (
        <>
            <section aria-label='スケジュール'>
                <QueryBoundary isPending={schedule.isPending} error={schedule.error} data={schedule.data}>
                    {(days) => {
                        const dayIndex = showDateTabs ? selectedIndex : 0
                        const day = days[dayIndex]

                        return (
                            <div className='flex flex-col gap-3'>
                                {showDateTabs && days.length > 0 && (
                                    <DateTabs
                                        days={days.map(({ date }, index) => ({ day: index + 1, date }))}
                                        selected={String(dayIndex + 1)}
                                        onSelect={(value) => setSelectedIndex(Number(value) - 1)}
                                        showAll={false}
                                        align='center'
                                    />
                                )}
                                {day && day.venues.some((venue) => venue.items.length > 0) ? (
                                    <Timetable day={day} />
                                ) : (
                                    <EmptyState
                                        title='スケジュールはまだありません'
                                        description='スケジュールが公開されると、ここに表示されます。'
                                        onRetry={() => void schedule.refetch()}
                                    />
                                )}
                            </div>
                        )
                    }}
                </QueryBoundary>
            </section>
            {children}
        </>
    )
}

function Timetable({ day }: { day: ScheduleDay }) {
    const items = day.venues.flatMap((venue) => venue.items)
    const startHour = Math.floor(Math.min(...items.map((item) => minutesOfDay(item.starts_at))) / 60)
    const endHour = Math.ceil(Math.max(...items.map((item) => minutesOfDay(item.ends_at))) / 60)
    const hours = Array.from({ length: endHour - startHour + 1 }, (_, index) => startHour + index)
    const toTop = (minutes: number) => ((minutes - startHour * 60) / 60) * HOUR_HEIGHT

    return (
        <div>
            <div className='flex gap-2 border-b border-slate-200 pb-2 pl-12'>
                {day.venues.map((venue) => (
                    <div key={venue.id} className='flex-1 text-center text-sm font-semibold text-slate-700'>
                        {venue.name}
                    </div>
                ))}
            </div>
            <div className='pt-4 pb-6'>
                <div className='relative' style={{ height: (endHour - startHour) * HOUR_HEIGHT }}>
                    {hours.map((hour) => (
                        <div
                            key={hour}
                            className='absolute inset-x-0 flex h-0 items-center gap-2'
                            style={{ top: toTop(hour * 60) }}
                        >
                            <span className='w-10 text-right text-xs text-slate-400'>{hour}:00</span>
                            <span className='h-px flex-1 bg-slate-200' />
                        </div>
                    ))}
                    <div className='absolute inset-y-0 right-0 left-12 flex gap-2'>
                        {day.venues.map((venue) => (
                            <ul key={venue.id} aria-label={venue.name} className='relative flex-1'>
                                {venue.items.map((item) => {
                                    const top = toTop(minutesOfDay(item.starts_at))
                                    const bottom = toTop(minutesOfDay(item.ends_at))
                                    return (
                                        <li
                                            key={item.id}
                                            className='absolute inset-x-0 flex flex-col overflow-hidden rounded-lg bg-amber-400 px-2 py-2'
                                            style={{ top, height: bottom - top }}
                                        >
                                            <span className='text-xs leading-snug font-semibold text-slate-900'>
                                                {item.title}
                                            </span>
                                            <span className='text-xs text-slate-900/80'>
                                                {`${dateFormatter(item.starts_at, 'H:mm')}-${dateFormatter(item.ends_at, 'H:mm')}`}
                                            </span>
                                        </li>
                                    )
                                })}
                            </ul>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    )
}
