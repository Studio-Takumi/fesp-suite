'use client'

import { createReactBlockSpec, useEditorState } from '@blocknote/react'
import { UserRound } from 'lucide-react'

import { ComponentBlockCard } from './ComponentBlockCard'

/**
 * 記事のサマリー（`postSummary`）。表示中の記事の作成者・日時・ハッシュタグを出す、props を持たない独自コンポーネントのブロック。
 * エディタ上ではカードに説明だけを出す
 */
export const createPostSummaryBlock = createReactBlockSpec(
    {
        type: 'postSummary',
        propSchema: {},
        content: 'none',
    },
    {
        render: function PostSummaryBlock({ block, editor }) {
            const isSelected = useEditorState({
                editor,
                selector: ({ editor }) => editor.getTextCursorPosition().block.id === block.id,
            })

            return (
                <ComponentBlockCard icon={<UserRound size={14} />} name='記事のサマリー' isSelected={isSelected}>
                    <div className='text-sm text-slate-700'>表示中の記事の作成者・日時・ハッシュタグを出します</div>
                </ComponentBlockCard>
            )
        },
    },
)
