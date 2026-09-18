import type { ReactNode } from 'react'

import { useQuery } from '@tanstack/react-query'
import { CalendarDays, Map as MapIcon, MapPin, Timer, Users } from 'lucide-react'

import { cn, dateFormatter } from '@fesp/ui'

import { artistColor } from '~/components/artist/artist-color'
import { QueryBoundary } from '~/components/QueryBoundary'
import type { Artist } from '~/lib/mock/artist'
import { currentArtistQuery } from '~/lib/queries'

import type { BlockComponentProps } from '../block-registry'

/**
 * 出演者のサマリー（独自コンポーネント `artistSummary`）。表示中の出演者の Day・団体・演目・出演日時・会場・人数と、
 * スケジュール・マップへのボタンを出す。props は持たない
 */
export function ArtistSummary({ children }: BlockComponentProps) {
    const artist = useQuery(currentArtistQuery())

    return (
        <>
            <section aria-label='出演者のサマリー'>
                <QueryBoundary isPending={artist.isPending} error={artist.error} data={artist.data}>
                    {(data) => <Summary artist={data} />}
                </QueryBoundary>
            </section>
            {children}
        </>
    )
}

function Summary({ artist }: { artist: Artist }) {
    const color = artistColor(artist.id)
    const time = `${artist.day}日目 ${dateFormatter(artist.starts_at, 'H:mm')} - ${dateFormatter(artist.ends_at, 'H:mm')}`

    return (
        <div className='flex flex-col gap-6'>
            <div className='flex flex-col gap-3'>
                <div className='flex items-center gap-2'>
                    <span
                        className={cn(
                            'font-en rounded-full px-3 py-1 text-xs font-semibold text-white',
                            color.accentBackground,
                        )}
                    >
                        Day{artist.day}
                    </span>
                    <span className='text-sm text-slate-500'>{artist.group}</span>
                </div>
                <div className='flex flex-col gap-1'>
                    <h1 className='text-2xl leading-snug font-bold text-slate-900'>{artist.name}</h1>
                    <p className='text-sm text-slate-900/60'>{artist.program}</p>
                </div>
                <dl className='flex flex-col gap-3 border-y border-slate-200 py-4'>
                    <SummaryRow icon={<Timer size={16} className='text-slate-400' aria-hidden />} label='出演'>
                        {time}
                    </SummaryRow>
                    <SummaryRow icon={<MapPin size={16} className='text-slate-400' aria-hidden />} label='会場'>
                        {artist.venue}
                    </SummaryRow>
                    <SummaryRow icon={<Users size={16} className='text-slate-400' aria-hidden />} label='人数'>
                        {artist.member_count}名
                    </SummaryRow>
                </dl>
            </div>
            <div className='flex flex-col gap-3'>
                <a
                    href='/schedule'
                    className='flex h-12 items-center justify-center gap-2 rounded-full bg-sky-500 text-sm font-semibold text-white'
                >
                    <CalendarDays size={18} aria-hidden />
                    スケジュールで見る
                </a>
                <a
                    href='/map'
                    className='flex h-12 items-center justify-center gap-2 rounded-full bg-slate-100 text-sm font-semibold text-slate-700'
                >
                    <MapIcon size={18} aria-hidden />
                    会場をマップで見る
                </a>
            </div>
        </div>
    )
}

type SummaryRowProps = {
    icon: ReactNode
    label: string
    children: ReactNode
}

function SummaryRow({ icon, label, children }: SummaryRowProps) {
    return (
        <div className='flex items-center gap-3'>
            <span className='flex shrink-0'>{icon}</span>
            <dt className='w-10 shrink-0 text-xs text-slate-400'>{label}</dt>
            <dd className='min-w-0 flex-1 text-sm font-medium text-slate-900'>{children}</dd>
        </div>
    )
}
