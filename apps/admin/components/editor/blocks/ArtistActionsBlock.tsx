'use client'

import { createReactBlockSpec, useEditorState } from '@blocknote/react'
import { MousePointerClick } from 'lucide-react'

import { ComponentBlockCard } from './ComponentBlockCard'

/**
 * 出演者のアクション（`artistActions`）。スケジュール・マップへ移動する「スケジュールで見る」
 * 「会場をマップで見る」ボタンを出す、props を持たない独自コンポーネントのブロック。
 * エディタ上ではカードに説明だけを出す
 */
export const createArtistActionsBlock = createReactBlockSpec(
    {
        type: 'artistActions',
        propSchema: {},
        content: 'none',
    },
    {
        render: function ArtistActionsBlock({ block, editor }) {
            const isSelected = useEditorState({
                editor,
                selector: ({ editor }) => editor.getTextCursorPosition().block.id === block.id,
            })

            return (
                <ComponentBlockCard
                    icon={<MousePointerClick size={14} />}
                    name='出演者のアクション'
                    isSelected={isSelected}
                >
                    <div className='text-sm text-slate-700'>
                        スケジュール・マップへ移動する「スケジュールで見る」「会場をマップで見る」ボタンを出します
                    </div>
                </ComponentBlockCard>
            )
        },
    },
)
