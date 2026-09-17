'use client'

import { createReactBlockSpec, useEditorState } from '@blocknote/react'
import { Sun } from 'lucide-react'

import { ComponentBlockCard } from './ComponentBlockCard'

/**
 * 今日の天気（`todayWeather`）。props を持たない独自コンポーネントのブロック。
 * エディタ上ではカード（ComponentBlockCard）の中に、何を出すブロックかの説明だけを出す（天気のデータは出さない）
 */
export const createTodayWeatherBlock = createReactBlockSpec(
    {
        type: 'todayWeather',
        propSchema: {},
        content: 'none',
    },
    {
        render: function TodayWeatherBlock({ block, editor }) {
            const isSelected = useEditorState({
                editor,
                selector: ({ editor }) => editor.getTextCursorPosition().block.id === block.id,
            })

            return (
                <ComponentBlockCard icon={<Sun size={14} />} name='今日の天気' isSelected={isSelected}>
                    <div className='text-sm text-slate-500'>今日の天気と気温を出します</div>
                </ComponentBlockCard>
            )
        },
    },
)
