import { ChevronRight } from 'lucide-react'

import { cn } from '@fesp/ui'

import { DayBadge } from '~/components/common/DayBadge'
import type { MapPlace } from '~/lib/mock/map'

/** サムネと開催日のバッジの色。場所の並び順で順番に使う */
const colors = [
    { thumbnail: 'bg-rose-200 text-rose-400', badge: 'bg-rose-400' },
    { thumbnail: 'bg-amber-200 text-amber-400', badge: 'bg-amber-400' },
    { thumbnail: 'bg-emerald-200 text-emerald-400', badge: 'bg-emerald-400' },
    { thumbnail: 'bg-violet-200 text-violet-400', badge: 'bg-violet-400' },
    { thumbnail: 'bg-sky-200 text-sky-500', badge: 'bg-sky-500' },
] as const

type MapPlaceListProps = {
    places: MapPlace[]
}

/** ボトムシートの場所の一覧。0件なら一覧の位置に短い文言を出す */
export function MapPlaceList({ places }: MapPlaceListProps) {
    if (places.length === 0) {
        return <p className='py-8 text-center text-sm text-slate-400'>該当する場所がありません</p>
    }

    return (
        <ul aria-label='場所の一覧' className='space-y-2 py-4'>
            {places.map((place, index) => {
                const color = colors[index % colors.length]!
                return (
                    <li key={place.id} className='flex items-center gap-3'>
                        <span
                            aria-hidden
                            className={cn(
                                'flex size-16 shrink-0 items-center justify-center rounded-lg text-xl font-bold',
                                color.thumbnail,
                            )}
                        >
                            {place.name.charAt(0)}
                        </span>
                        <div className='flex min-w-0 flex-1 flex-col gap-0.5'>
                            <div className='flex items-center gap-2'>
                                <DayBadge day={place.day} className={color.badge} />
                                <span className='truncate text-xs text-slate-400'>{place.group}</span>
                            </div>
                            <p className='truncate text-base font-semibold text-slate-900'>{place.name}</p>
                            <p className='truncate text-xs text-slate-500'>@ {place.location}</p>
                        </div>
                        <ChevronRight size={18} aria-hidden className='shrink-0 text-slate-300' />
                    </li>
                )
            })}
        </ul>
    )
}
