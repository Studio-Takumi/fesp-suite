'use client'

import { createReactBlockSpec, useEditorState } from '@blocknote/react'
import { Files } from 'lucide-react'

import { ComponentBlockCard } from './ComponentBlockCard'

/**
 * 関連する記事（`relatedPosts`）。表示中の記事に関連する記事を出す、props を持たない独自コンポーネントのブロック。
 * エディタ上ではカードに説明だけを出す
 */
export const createRelatedPostsBlock = createReactBlockSpec(
    {
        type: 'relatedPosts',
        propSchema: {},
        content: 'none',
    },
    {
        render: function RelatedPostsBlock({ block, editor }) {
            const isSelected = useEditorState({
                editor,
                selector: ({ editor }) => editor.getTextCursorPosition().block.id === block.id,
            })

            return (
                <ComponentBlockCard icon={<Files size={14} />} name='関連する記事' isSelected={isSelected}>
                    <div className='text-sm text-slate-700'>表示中の記事に関連する記事を出します</div>
                </ComponentBlockCard>
            )
        },
    },
)
