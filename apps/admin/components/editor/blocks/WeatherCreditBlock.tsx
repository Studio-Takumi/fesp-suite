'use client'

import { createReactBlockSpec, useEditorState } from '@blocknote/react'
import { RefreshCw } from 'lucide-react'

import { ComponentBlockCard } from './ComponentBlockCard'

/**
 * 天気の更新時刻・出典（`weatherCredit`）。props を持たない独自コンポーネントのブロック。
 * エディタ上ではカード（ComponentBlockCard）の中に、何を出すブロックかの説明だけを出す（天気のデータは出さない）
 */
export const createWeatherCreditBlock = createReactBlockSpec(
    {
        type: 'weatherCredit',
        propSchema: {},
        content: 'none',
    },
    {
        render: function WeatherCreditBlock({ block, editor }) {
            const isSelected = useEditorState({
                editor,
                selector: ({ editor }) => editor.getTextCursorPosition().block.id === block.id,
            })

            return (
                <ComponentBlockCard icon={<RefreshCw size={14} />} name='天気の更新時刻・出典' isSelected={isSelected}>
                    <div className='text-sm text-slate-500'>天気の更新時刻と出典（気象庁）を出します</div>
                </ComponentBlockCard>
            )
        },
    },
)
