'use client'

import { createReactBlockSpec, useEditorState } from '@blocknote/react'
import { useQuery } from '@tanstack/react-query'
import { Music } from 'lucide-react'

import { type ArtistListProps, parseIdListProp } from '@fesp/schema'

import type { ArtistTag } from '~/lib/mock/artist'
import { artistTagsQuery } from '~/lib/queries'

import { ComponentBlockCard } from './ComponentBlockCard'

/** カードに出す設定の要約（1要素1行）。選んだタグはタグの一覧の順に並べ、一覧に無い ID は出さない */
export function summarizeArtistListProps(props: ArtistListProps, tags: ArtistTag[]): string[] {
    const tagIds = parseIdListProp(props.tags)
    const tagNames = tags.filter((tag) => tagIds.includes(tag.id)).map((tag) => tag.name)

    return [
        `日付タブ: ${props.showDateTabs ? 'あり' : 'なし'}`,
        `検索: ${props.showSearch ? 'あり' : 'なし'}`,
        `並び替え: ${props.showSort ? 'あり' : 'なし'}`,
        props.showTagTabs
            ? `タグタブ: あり（${tagNames.length > 0 ? tagNames.join('・') : 'タグ未選択'}）`
            : 'タグタブ: なし',
    ]
}

/**
 * 出演者一覧（`artistList`）。中身を持たない独自コンポーネントのブロックで、props はサイドパネル（ComponentPropsPanel）で編集する。
 * エディタ上ではカードに設定の要約だけを出す（出演者のプレビューはしない）
 */
export const createArtistListBlock = createReactBlockSpec(
    {
        type: 'artistList',
        propSchema: {
            showDateTabs: { default: true },
            showSearch: { default: true },
            showSort: { default: true },
            showTagTabs: { default: true },
            /** タブに出すタグの ID をカンマ区切りで並べた文字列 */
            tags: { default: '' },
        },
        content: 'none',
    },
    {
        render: function ArtistListBlock({ block, editor }) {
            const isSelected = useEditorState({
                editor,
                selector: ({ editor }) => editor.getTextCursorPosition().block.id === block.id,
            })
            const tags = useQuery(artistTagsQuery())

            return (
                <ComponentBlockCard icon={<Music size={14} />} name='出演者一覧' isSelected={isSelected}>
                    <div className='flex flex-col gap-1 text-sm text-slate-700'>
                        {summarizeArtistListProps(block.props, tags.data ?? []).map((line) => (
                            <div key={line}>{line}</div>
                        ))}
                    </div>
                </ComponentBlockCard>
            )
        },
    },
)
