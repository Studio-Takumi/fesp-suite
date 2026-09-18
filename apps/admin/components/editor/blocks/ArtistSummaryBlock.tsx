'use client'

import { createReactBlockSpec, useEditorState } from '@blocknote/react'
import { Mic } from 'lucide-react'

import { ComponentBlockCard } from './ComponentBlockCard'

/**
 * 出演者のサマリー（`artistSummary`）。表示中の出演者の Day・団体・演目・出演日時・会場・人数と、
 * スケジュール・マップへのボタンを出す、props を持たない独自コンポーネントのブロック。
 * エディタ上ではカードに説明だけを出す
 */
export const createArtistSummaryBlock = createReactBlockSpec(
    {
        type: 'artistSummary',
        propSchema: {},
        content: 'none',
    },
    {
        render: function ArtistSummaryBlock({ block, editor }) {
            const isSelected = useEditorState({
                editor,
                selector: ({ editor }) => editor.getTextCursorPosition().block.id === block.id,
            })

            return (
                <ComponentBlockCard icon={<Mic size={14} />} name='出演者のサマリー' isSelected={isSelected}>
                    <div className='text-sm text-slate-700'>
                        表示中の出演者の
                        Day・団体・演目・出演日時・会場・人数と、スケジュール・マップへのボタンを出します
                    </div>
                </ComponentBlockCard>
            )
        },
    },
)
