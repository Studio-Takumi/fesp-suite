'use client'

import { createReactBlockSpec, useEditorState } from '@blocknote/react'
import { Info } from 'lucide-react'

import { ComponentBlockCard } from './ComponentBlockCard'

/**
 * 模擬店のサマリー（`shopSummary`）。表示中の模擬店の Day・団体・店名・時間・場所と「マップで見る」を出す、
 * props を持たない独自コンポーネントのブロック。エディタ上ではカードに説明だけを出す
 */
export const createShopSummaryBlock = createReactBlockSpec(
    {
        type: 'shopSummary',
        propSchema: {},
        content: 'none',
    },
    {
        render: function ShopSummaryBlock({ block, editor }) {
            const isSelected = useEditorState({
                editor,
                selector: ({ editor }) => editor.getTextCursorPosition().block.id === block.id,
            })

            return (
                <ComponentBlockCard icon={<Info size={14} />} name='模擬店のサマリー' isSelected={isSelected}>
                    <div className='text-sm text-slate-700'>
                        表示中の模擬店の Day・団体・店名・時間・場所と「マップで見る」を出します
                    </div>
                </ComponentBlockCard>
            )
        },
    },
)
