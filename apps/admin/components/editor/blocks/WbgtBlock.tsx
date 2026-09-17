'use client'

import { createReactBlockSpec, useEditorState } from '@blocknote/react'
import { Thermometer } from 'lucide-react'

import { ComponentBlockCard } from './ComponentBlockCard'

/**
 * 暑さ指数（`wbgt`）。props を持たない独自コンポーネントのブロック。
 * エディタ上ではカード（ComponentBlockCard）の中に、何を出すブロックかの説明だけを出す（天気のデータは出さない）
 */
export const createWbgtBlock = createReactBlockSpec(
    {
        type: 'wbgt',
        propSchema: {},
        content: 'none',
    },
    {
        render: function WbgtBlock({ block, editor }) {
            const isSelected = useEditorState({
                editor,
                selector: ({ editor }) => editor.getTextCursorPosition().block.id === block.id,
            })

            return (
                <ComponentBlockCard icon={<Thermometer size={14} />} name='暑さ指数' isSelected={isSelected}>
                    <div className='text-sm text-slate-500'>暑さ指数（WBGT）と段階を出します</div>
                </ComponentBlockCard>
            )
        },
    },
)
