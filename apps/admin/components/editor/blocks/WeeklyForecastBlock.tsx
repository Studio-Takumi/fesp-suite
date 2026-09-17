'use client'

import { createReactBlockSpec, useEditorState } from '@blocknote/react'
import { CalendarDays } from 'lucide-react'

import { ComponentBlockCard } from './ComponentBlockCard'

/**
 * 週間予報（`weeklyForecast`）。props を持たない独自コンポーネントのブロック。
 * エディタ上ではカード（ComponentBlockCard）の中に、何を出すブロックかの説明だけを出す（天気のデータは出さない）
 */
export const createWeeklyForecastBlock = createReactBlockSpec(
    {
        type: 'weeklyForecast',
        propSchema: {},
        content: 'none',
    },
    {
        render: function WeeklyForecastBlock({ block, editor }) {
            const isSelected = useEditorState({
                editor,
                selector: ({ editor }) => editor.getTextCursorPosition().block.id === block.id,
            })

            return (
                <ComponentBlockCard icon={<CalendarDays size={14} />} name='週間予報' isSelected={isSelected}>
                    <div className='text-sm text-slate-500'>1週間分の天気と気温を横に並べて出します</div>
                </ComponentBlockCard>
            )
        },
    },
)
