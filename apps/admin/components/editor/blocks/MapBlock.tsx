'use client'

import { createReactBlockSpec, useEditorState } from '@blocknote/react'
import { MapIcon } from 'lucide-react'

import { ComponentBlockCard } from './ComponentBlockCard'

/**
 * マップ（`map`）。デザインの `web / Map / iPhone` を1ページ分出す独自コンポーネントのブロック。
 * props を持たないので、エディタ上ではカード（ComponentBlockCard）に説明の一文だけを出す
 */
export const createMapBlock = createReactBlockSpec(
    {
        type: 'map',
        propSchema: {},
        content: 'none',
    },
    {
        render: function MapBlock({ block, editor }) {
            const isSelected = useEditorState({
                editor,
                selector: ({ editor }) => editor.getTextCursorPosition().block.id === block.id,
            })

            return (
                <ComponentBlockCard icon={<MapIcon size={14} />} name='マップ' isSelected={isSelected}>
                    <div className='text-sm text-slate-500'>会場のマップを出します</div>
                </ComponentBlockCard>
            )
        },
    },
)
