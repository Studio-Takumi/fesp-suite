'use client'

import { createReactBlockSpec, useEditorState } from '@blocknote/react'
import { LayoutGrid } from 'lucide-react'

import { type ContentListProps, parseContentListLinks } from '@fesp/schema'

import { ComponentBlockCard } from './ComponentBlockCard'

/** カードに出す設定の要約（1要素1行）。リンクが1件も無ければ空 */
export function summarizeContentListProps(props: ContentListProps): string[] {
    const links = parseContentListLinks(props.links)
    if (links.length === 0) return []

    return [`リンク: ${links.length}件`, ...links.map((link) => `${link.label} → ${link.href}`)]
}

/**
 * その他のコンテンツ（`contentList`）。中身を持たない独自コンポーネントのブロックで、props はサイドパネル（ComponentPropsPanel）で編集する。
 * エディタ上ではカードに設定の要約（リンクの件数と行き先）だけを出す
 */
export const createContentListBlock = createReactBlockSpec(
    {
        type: 'contentList',
        propSchema: {
            /** リンクの並び。1行が1件で `表示名|アイコン|リンク先` */
            links: { default: '' },
        },
        content: 'none',
    },
    {
        render: function ContentListBlock({ block, editor }) {
            const isSelected = useEditorState({
                editor,
                selector: ({ editor }) => editor.getTextCursorPosition().block.id === block.id,
            })
            const summary = summarizeContentListProps(block.props)

            return (
                <ComponentBlockCard icon={<LayoutGrid size={14} />} name='その他のコンテンツ' isSelected={isSelected}>
                    {summary.length > 0 ? (
                        <div className='flex flex-col gap-1 text-sm break-all text-slate-700'>
                            {summary.map((line) => (
                                <div key={line}>{line}</div>
                            ))}
                        </div>
                    ) : (
                        <div className='text-sm text-slate-400'>
                            リンクが設定されていません（ウェブアプリには何も出ません）
                        </div>
                    )}
                </ComponentBlockCard>
            )
        },
    },
)
