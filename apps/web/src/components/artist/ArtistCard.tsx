import { Link } from '@tanstack/react-router'
import { MapPin, Timer } from 'lucide-react'

import { cn, dateFormatter } from '@fesp/ui'

import { DayBadge } from '~/components/common/DayBadge'
import { cardColorFromId } from '~/components/list/card-color'
import type { Artist } from '~/lib/mock/artist'

export type ArtistCardProps = {
    artist: Artist
}

/** 出演者一覧の1枚（デザインの ArtistCard）。上に色付きの枠、下に Day・団体名・出演者名・出演時間・会場 */
export function ArtistCard({ artist }: ArtistCardProps) {
    const color = cardColorFromId(artist.id)
    const time = `${dateFormatter(artist.starts_at, 'H:mm')} - ${dateFormatter(artist.ends_at, 'H:mm')}`

    return (
        <Link
            to='/artist/$artistId'
            params={{ artistId: artist.id }}
            className='flex flex-col gap-3'
            activeProps={{ className: 'rounded-xl bg-sky-50' }}
        >
            <div
                className={cn(
                    'relative flex h-44 flex-col items-center justify-center gap-2 overflow-hidden rounded-2xl',
                    color.surface,
                )}
            >
                {artist.image_url ? (
                    <img src={artist.image_url} alt='' className='size-full object-cover' />
                ) : (
                    <>
                        {/* デザインの「コーナー」（左上の三角の飾り） */}
                        <svg
                            viewBox='0 0 64 64'
                            aria-hidden
                            className={cn('absolute top-0 left-0 size-16', color.accentText)}
                        >
                            <path d='M0 0l64 0-64 64z' fill='currentColor' />
                        </svg>
                        <span
                            className={cn(
                                'font-en flex size-20 items-center justify-center rounded-full bg-white/60 text-4xl',
                                color.accentText,
                            )}
                        >
                            {[...artist.name][0]}
                        </span>
                        <span className='text-lg font-bold text-slate-900'>{artist.name}</span>
                        <span className='text-xs text-slate-900/60'>{artist.program}</span>
                    </>
                )}
            </div>
            <div className='flex flex-col gap-2'>
                <div className='flex items-center gap-2'>
                    <DayBadge day={artist.day} className={color.accent} />
                    <span className='text-xs text-slate-500'>{artist.group}</span>
                </div>
                <h2 className='text-lg leading-snug font-bold text-slate-900'>{artist.name}</h2>
                <div className='flex flex-wrap items-center gap-4 text-xs text-slate-500'>
                    <span className='flex items-center gap-1'>
                        <Timer size={14} className='text-slate-400' aria-hidden />
                        <span className='font-en'>{time}</span>
                    </span>
                    <span className='flex items-center gap-1'>
                        <MapPin size={14} className='text-slate-400' aria-hidden />
                        {artist.venue}
                    </span>
                </div>
            </div>
        </Link>
    )
}
