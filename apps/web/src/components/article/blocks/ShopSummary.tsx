import { useQuery } from '@tanstack/react-query'
import { MapIcon, MapPin, Timer } from 'lucide-react'

import { cn, dateFormatter } from '@fesp/ui'

import { cardColors } from '~/components/list/card-color'
import { QueryBoundary } from '~/components/QueryBoundary'
import { currentShopQuery } from '~/lib/queries'

import type { BlockComponentProps } from '../block-registry'

/**
 * 模擬店のサマリー（独自コンポーネント `shopSummary`）。表示中の模擬店の Day・団体・店名・時間・場所と
 * 「マップで見る」を出す。props は持たない
 */
export function ShopSummary({ children }: BlockComponentProps) {
    const shop = useQuery(currentShopQuery())

    return (
        <>
            <section aria-label='模擬店の情報' className='flex flex-col gap-3'>
                <QueryBoundary isPending={shop.isPending} error={shop.error} data={shop.data}>
                    {(data) => (
                        <>
                            <div className='flex items-center gap-2'>
                                <span
                                    className={cn(
                                        'rounded-full px-3 py-1 text-xs font-bold text-white',
                                        cardColors[data.color].accent,
                                    )}
                                >
                                    Day{data.day}
                                </span>
                                <span className='text-sm text-slate-500'>{data.group}</span>
                            </div>
                            <h2 className='text-2xl leading-snug font-bold text-slate-900'>{data.name}</h2>
                            <dl className='flex flex-col gap-3 border-y border-slate-200 py-4'>
                                <div className='flex items-center gap-3'>
                                    <dt className='flex w-16 shrink-0 items-center gap-2 text-xs text-slate-400'>
                                        <Timer size={16} aria-hidden />
                                        時間
                                    </dt>
                                    <dd className='text-sm font-medium text-slate-900'>
                                        {`${dateFormatter(data.starts_at, 'H:mm')} - ${dateFormatter(data.ends_at, 'H:mm')}`}
                                    </dd>
                                </div>
                                <div className='flex items-center gap-3'>
                                    <dt className='flex w-16 shrink-0 items-center gap-2 text-xs text-slate-400'>
                                        <MapPin size={16} aria-hidden />
                                        場所
                                    </dt>
                                    <dd className='text-sm font-medium text-slate-900'>{data.location}</dd>
                                </div>
                            </dl>
                            <a
                                href='/map'
                                className='flex h-12 items-center justify-center gap-2 rounded-full bg-sky-500 text-sm font-semibold text-white'
                            >
                                <MapIcon size={18} aria-hidden />
                                マップで見る
                            </a>
                        </>
                    )}
                </QueryBoundary>
            </section>
            {children}
        </>
    )
}
