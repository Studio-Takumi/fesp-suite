import { useQuery } from '@tanstack/react-query'
import { MapPin, Timer, Users } from 'lucide-react'

import { dateFormatter } from '@fesp/ui'

import { DayBadge } from '~/components/common/DayBadge'
import { cardColorFromId } from '~/components/list/card-color'
import { QueryBoundary } from '~/components/QueryBoundary'
import { currentArtistQuery } from '~/lib/queries'

import type { BlockComponentProps } from '../block-registry'

/**
 * 出演者のサマリー（独自コンポーネント `artistSummary`）。表示中の出演者の Day・団体・演目・出演日時・会場・人数を
 * 出す。props は持たない。スケジュール・マップへのボタンは `artistActions` の担当
 */
export function ArtistSummary({ children }: BlockComponentProps) {
    const artist = useQuery(currentArtistQuery())

    return (
        <>
            <section aria-label='出演者のサマリー' className='flex flex-col gap-3'>
                <QueryBoundary isPending={artist.isPending} error={artist.error} data={artist.data}>
                    {(data) => (
                        <>
                            <div className='flex items-center gap-2'>
                                <DayBadge day={data.day} className={cardColorFromId(data.id).accent} />
                                <span className='text-sm text-slate-500'>{data.group}</span>
                            </div>
                            <div className='flex flex-col gap-1'>
                                <h1 className='text-2xl leading-snug font-bold text-slate-900'>{data.name}</h1>
                                <p className='text-sm text-slate-900/60'>{data.program}</p>
                            </div>
                            <dl className='flex flex-col gap-3 border-y border-slate-200 py-4'>
                                <div className='flex items-center gap-3'>
                                    <dt className='flex w-16 shrink-0 items-center gap-2 text-xs text-slate-400'>
                                        <Timer size={16} aria-hidden />
                                        出演
                                    </dt>
                                    <dd className='min-w-0 flex-1 text-sm font-medium text-slate-900'>
                                        {`${data.day}日目 ${dateFormatter(data.starts_at, 'H:mm')} - ${dateFormatter(data.ends_at, 'H:mm')}`}
                                    </dd>
                                </div>
                                <div className='flex items-center gap-3'>
                                    <dt className='flex w-16 shrink-0 items-center gap-2 text-xs text-slate-400'>
                                        <MapPin size={16} aria-hidden />
                                        会場
                                    </dt>
                                    <dd className='min-w-0 flex-1 text-sm font-medium text-slate-900'>{data.venue}</dd>
                                </div>
                                <div className='flex items-center gap-3'>
                                    <dt className='flex w-16 shrink-0 items-center gap-2 text-xs text-slate-400'>
                                        <Users size={16} aria-hidden />
                                        人数
                                    </dt>
                                    <dd className='min-w-0 flex-1 text-sm font-medium text-slate-900'>
                                        {data.member_count}名
                                    </dd>
                                </div>
                            </dl>
                        </>
                    )}
                </QueryBoundary>
            </section>
            {children}
        </>
    )
}
