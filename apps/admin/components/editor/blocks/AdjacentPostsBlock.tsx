'use client'

import { createReactBlockSpec, useEditorState } from '@blocknote/react'
import { ArrowLeftRight } from 'lucide-react'

import { ComponentBlockCard } from './ComponentBlockCard'

/**
 * 前後の記事（`adjacentPosts`）。表示中の記事の前の記事・次の記事へのリンクを出す、props を持たない独自コンポーネントのブロック。
 * エディタ上ではカードに説明だけを出す
 */
export const createAdjacentPostsBlock = createReactBlockSpec(
    {
        type: 'adjacentPosts',
        propSchema: {},
        content: 'none',
    },
    {
        render: function AdjacentPostsBlock({ block, editor }) {
            const isSelected = useEditorState({
                editor,
                selector: ({ editor }) => editor.getTextCursorPosition().block.id === block.id,
            })

            return (
                <ComponentBlockCard icon={<ArrowLeftRight size={14} />} name='前後の記事' isSelected={isSelected}>
                    <div className='text-sm text-slate-700'>表示中の記事の前の記事・次の記事へのリンクを出します</div>
                </ComponentBlockCard>
            )
        },
    },
)
