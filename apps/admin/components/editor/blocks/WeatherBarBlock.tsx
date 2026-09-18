'use client'

import { createReactBlockSpec, useEditorState } from '@blocknote/react'
import { CloudSun } from 'lucide-react'

import { ComponentBlockCard } from './ComponentBlockCard'

/**
 * 日付・天気の帯（`weatherBar`）。props を持たない独自コンポーネントのブロック。
 * エディタ上ではカード（ComponentBlockCard）の中に、何を出すブロックかの説明だけを出す（天気のデータは出さない）
 */
export const createWeatherBarBlock = createReactBlockSpec(
    {
        type: 'weatherBar',
        propSchema: {},
        content: 'none',
    },
    {
        render: function WeatherBarBlock({ block, editor }) {
            const isSelected = useEditorState({
                editor,
                selector: ({ editor }) => editor.getTextCursorPosition().block.id === block.id,
            })

            return (
                <ComponentBlockCard icon={<CloudSun size={14} />} name='日付・天気の帯' isSelected={isSelected}>
                    <div className='text-sm text-slate-500'>
                        今日の日付・天気を出します（押すと天気ページに移動します）
                    </div>
                </ComponentBlockCard>
            )
        },
    },
)
