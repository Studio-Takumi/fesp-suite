'use client'

import { createReactBlockSpec, useEditorState } from '@blocknote/react'
import { MousePointerClick } from 'lucide-react'

import { ComponentBlockCard } from './ComponentBlockCard'

/**
 * 模擬店のアクション（`shopActions`）。マップへ移動する「マップで見る」ボタンを出す、
 * props を持たない独自コンポーネントのブロック。エディタ上ではカードに説明だけを出す
 */
export const createShopActionsBlock = createReactBlockSpec(
    {
        type: 'shopActions',
        propSchema: {},
        content: 'none',
    },
    {
        render: function ShopActionsBlock({ block, editor }) {
            const isSelected = useEditorState({
                editor,
                selector: ({ editor }) => editor.getTextCursorPosition().block.id === block.id,
            })

            return (
                <ComponentBlockCard
                    icon={<MousePointerClick size={14} />}
                    name='模擬店のアクション'
                    isSelected={isSelected}
                >
                    <div className='text-sm text-slate-700'>マップへ移動する「マップで見る」ボタンを出します</div>
                </ComponentBlockCard>
            )
        },
    },
)
