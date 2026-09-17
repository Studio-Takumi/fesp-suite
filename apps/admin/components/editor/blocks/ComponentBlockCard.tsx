'use client'

import type { ReactNode } from 'react'

import { Settings2 } from 'lucide-react'

import { cn } from '~/lib/utils'

export type ComponentBlockCardProps = {
    /** BlockNote の CSS が `size-` クラスの無い svg の大きさを戻すので、`size-3.5` を付けて渡す */
    icon: ReactNode
    name: string
    /** カーソルがこのブロックにある（サイドパネルで編集中）か */
    isSelected: boolean
    children: ReactNode
}

/**
 * エディタ上の独自コンポーネントのブロックの枠。ヘッダーにアイコン・名前・「設定」を出し、その下に中身を出す。
 * 選択している間は水色にし、「設定」を「編集中」にする。
 * 文字は `<p>` にしない（BlockNote の `.bn-default-styles p` が文字の大きさを親に揃えてしまう）
 */
export function ComponentBlockCard({ icon, name, isSelected, children }: ComponentBlockCardProps) {
    return (
        <div
            contentEditable={false}
            data-component-block=''
            data-selected={isSelected || undefined}
            className={cn(
                'w-full overflow-hidden rounded-[10px] border bg-white',
                isSelected ? 'border-sky-400 ring-1 ring-sky-400' : 'border-slate-200',
            )}
        >
            <div
                className={cn(
                    'flex items-center gap-1.5 px-3 py-2 text-xs',
                    isSelected ? 'bg-sky-50 text-sky-500' : 'bg-slate-50 text-slate-700',
                )}
            >
                <span className={cn('flex', isSelected ? 'text-sky-500' : 'text-slate-500')}>{icon}</span>
                <span className='font-bold'>{name}</span>
                <span
                    className={cn(
                        'ml-auto flex items-center gap-1 text-[11px]',
                        isSelected ? 'text-sky-500' : 'text-slate-400',
                    )}
                >
                    <Settings2 className='size-3.5' />
                    {isSelected ? '編集中' : '設定'}
                </span>
            </div>
            <div className='px-4 py-3.5'>{children}</div>
        </div>
    )
}
