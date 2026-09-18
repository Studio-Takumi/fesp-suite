'use client'

import { createReactBlockSpec, useEditorState } from '@blocknote/react'
import { ListMusic } from 'lucide-react'

import { ComponentBlockCard } from './ComponentBlockCard'

/**
 * セットリスト（`setList`）。表示中の出演者のセットリストを出す、props を持たない独自コンポーネントのブロック。
 * エディタ上ではカードに説明だけを出す
 */
export const createSetListBlock = createReactBlockSpec(
    {
        type: 'setList',
        propSchema: {},
        content: 'none',
    },
    {
        render: function SetListBlock({ block, editor }) {
            const isSelected = useEditorState({
                editor,
                selector: ({ editor }) => editor.getTextCursorPosition().block.id === block.id,
            })

            return (
                <ComponentBlockCard icon={<ListMusic size={14} />} name='セットリスト' isSelected={isSelected}>
                    <div className='text-sm text-slate-700'>表示中の出演者のセットリストを出します</div>
                </ComponentBlockCard>
            )
        },
    },
)
