import { useQuery } from '@tanstack/react-query'

import { cn } from '@fesp/ui'

import { weatherQuery } from '~/lib/queries'

import type { BlockComponentProps } from '../block-registry'

/** 暑さ指数の段階。`min` 以上を、その段階にする（低い順） */
const wbgtLevels = [
    {
        name: '注意',
        min: -Infinity,
        range: '〜25',
        advice: '積極的に水分補給を',
        text: 'text-sky-400',
        bar: 'bg-sky-400',
    },
    {
        name: '警戒',
        min: 25,
        range: '25〜',
        advice: '運動時は積極的に休憩を',
        text: 'text-amber-400',
        bar: 'bg-amber-400',
    },
    {
        name: '厳重警戒',
        min: 28,
        range: '28〜',
        advice: '激しい運動は避けましょう',
        text: 'text-orange-400',
        bar: 'bg-orange-400',
    },
    {
        name: '危険',
        min: 31,
        range: '31〜',
        advice: '運動は原則中止しましょう',
        text: 'text-rose-500',
        bar: 'bg-rose-500',
    },
    {
        name: 'アラート',
        min: 33,
        range: '33〜',
        advice: '不要不急の外出は避けましょう',
        text: 'text-violet-400',
        bar: 'bg-violet-400',
    },
] as const

/**
 * 暑さ指数（独自コンポーネント `wbgt`）。値・段階・一言と、5つの段階の目盛り。
 * 読み込み中・失敗したときは何も出さない
 */
export function Wbgt({ block, children }: BlockComponentProps) {
    const { data } = useQuery(weatherQuery())
    const level = data ? wbgtLevels.findLast((level) => data.wbgt >= level.min) : undefined
    const headingId = `wbgt-${block.id}`

    return (
        <>
            {data && level && (
                <section aria-labelledby={headingId} className='flex flex-col gap-3 rounded-lg bg-slate-50 p-4'>
                    <div className='flex items-end justify-between gap-2'>
                        <div className='flex flex-col gap-1'>
                            <h2 id={headingId} className='text-sm text-slate-500'>
                                暑さ指数（WBGT）
                            </h2>
                            <p className={cn('flex items-baseline gap-2', level.text)}>
                                <span className='text-3xl leading-none font-medium'>{data.wbgt}</span>
                                <span className='text-base font-bold'>{level.name}</span>
                            </p>
                        </div>
                        <p className='text-right text-xs text-slate-400'>{level.advice}</p>
                    </div>
                    <div className='flex flex-col gap-2' aria-hidden>
                        <div className='flex gap-px'>
                            {wbgtLevels.map((item) => (
                                <div
                                    key={item.name}
                                    className={cn('h-2 flex-1 first:rounded-l last:rounded-r', item.bar)}
                                />
                            ))}
                        </div>
                        <div className='flex gap-px'>
                            {wbgtLevels.map((item) => (
                                <div
                                    key={item.name}
                                    className='flex flex-1 flex-col items-center text-xs leading-tight'
                                >
                                    <span className='text-slate-400'>{item.range}</span>
                                    <span className={item.text}>{item.name}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>
            )}
            {children}
        </>
    )
}
