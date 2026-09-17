'use client'

import { createReactBlockSpec, useEditorState } from '@blocknote/react'
import { FileText } from 'lucide-react'

import { ComponentBlockCard } from './ComponentBlockCard'

/**
 * 天気概況（`weatherOverview`）。props を持たない独自コンポーネントのブロック。
 * エディタ上ではカード（ComponentBlockCard）の中に、何を出すブロックかの説明だけを出す（天気のデータは出さない）
 */
export const createWeatherOverviewBlock = createReactBlockSpec(
    {
        type: 'weatherOverview',
        propSchema: {},
        content: 'none',
    },
    {
        render: function WeatherOverviewBlock({ block, editor }) {
            const isSelected = useEditorState({
                editor,
                selector: ({ editor }) => editor.getTextCursorPosition().block.id === block.id,
            })

            return (
                <ComponentBlockCard icon={<FileText size={14} />} name='天気概況' isSelected={isSelected}>
                    <div className='text-sm text-slate-500'>気象台の天気概況の文章を出します</div>
                </ComponentBlockCard>
            )
        },
    },
)
