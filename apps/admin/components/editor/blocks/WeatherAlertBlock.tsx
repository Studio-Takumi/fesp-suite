'use client'

import { createReactBlockSpec, useEditorState } from '@blocknote/react'
import { TriangleAlert } from 'lucide-react'

import { ComponentBlockCard } from './ComponentBlockCard'

/**
 * 気象警報・注意報（`weatherAlert`）。props を持たない独自コンポーネントのブロック。
 * エディタ上ではカード（ComponentBlockCard）の中に、何を出すブロックかの説明だけを出す（天気のデータは出さない）
 */
export const createWeatherAlertBlock = createReactBlockSpec(
    {
        type: 'weatherAlert',
        propSchema: {},
        content: 'none',
    },
    {
        render: function WeatherAlertBlock({ block, editor }) {
            const isSelected = useEditorState({
                editor,
                selector: ({ editor }) => editor.getTextCursorPosition().block.id === block.id,
            })

            return (
                <ComponentBlockCard icon={<TriangleAlert size={14} />} name='気象警報・注意報' isSelected={isSelected}>
                    <div className='text-sm text-slate-500'>発表中の警報・注意報を出します（無いときは出しません）</div>
                </ComponentBlockCard>
            )
        },
    },
)
