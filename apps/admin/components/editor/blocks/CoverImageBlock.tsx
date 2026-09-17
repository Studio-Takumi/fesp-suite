'use client'

import { createReactBlockSpec, useEditorState } from '@blocknote/react'
import { ImageIcon } from 'lucide-react'

import { ComponentBlockCard } from './ComponentBlockCard'

/**
 * 記事の画像（`coverImage`）。中身を持たない独自コンポーネントのブロックで、props はサイドパネル（ComponentPropsPanel）で編集する。
 * エディタ上ではカードに設定の要約（画像の URL）だけを出す
 */
export const createCoverImageBlock = createReactBlockSpec(
    {
        type: 'coverImage',
        propSchema: {
            imageUrl: { default: '' },
        },
        content: 'none',
    },
    {
        render: function CoverImageBlock({ block, editor }) {
            const isSelected = useEditorState({
                editor,
                selector: ({ editor }) => editor.getTextCursorPosition().block.id === block.id,
            })
            const { imageUrl } = block.props

            return (
                <ComponentBlockCard icon={<ImageIcon size={14} />} name='記事の画像' isSelected={isSelected}>
                    {imageUrl ? (
                        <div className='text-sm break-all text-slate-700'>画像: {imageUrl}</div>
                    ) : (
                        <div className='text-sm text-slate-400'>
                            画像が設定されていません（ウェブアプリには何も出ません）
                        </div>
                    )}
                </ComponentBlockCard>
            )
        },
    },
)
