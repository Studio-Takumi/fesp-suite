import { useQuery } from '@tanstack/react-query'
import { TriangleAlert } from 'lucide-react'

import { cn } from '@fesp/ui'

import { weatherQuery } from '~/lib/queries'

import type { BlockComponentProps } from '../block-registry'

/** 警報・注意報 → 読み上げる名前とチップの色 */
const warningLevels = {
    warning: { label: '警報', className: 'bg-rose-500 text-white' },
    advisory: { label: '注意報', className: 'bg-amber-400 text-slate-900' },
}

/**
 * 気象警報・注意報（独自コンポーネント `weatherAlert`）。発表中の警報・注意報のチップと、気象台の解説。
 * 発表中のものが無いとき・読み込み中・失敗したときは何も出さない
 */
export function WeatherAlert({ children }: BlockComponentProps) {
    const { data } = useQuery(weatherQuery())
    const alert = data?.alert

    return (
        <>
            {alert && alert.warnings.length > 0 && (
                <section
                    aria-label='気象警報・注意報'
                    className='flex flex-col gap-2 rounded-2xl border border-red-200 bg-red-50 p-4'
                >
                    <div className='flex items-center gap-2'>
                        <TriangleAlert size={18} className='shrink-0 text-rose-500' aria-hidden />
                        <ul className='flex flex-wrap gap-2'>
                            {alert.warnings.map((warning) => (
                                <li
                                    key={`${warning.level}-${warning.name}`}
                                    className={cn(
                                        'rounded-md px-3 py-1 text-xs font-bold',
                                        warningLevels[warning.level].className,
                                    )}
                                >
                                    {warning.name}
                                    <span className='sr-only'>{warningLevels[warning.level].label}</span>
                                </li>
                            ))}
                        </ul>
                    </div>
                    {alert.description && <p className='text-sm leading-relaxed text-slate-700'>{alert.description}</p>}
                </section>
            )}
            {children}
        </>
    )
}
