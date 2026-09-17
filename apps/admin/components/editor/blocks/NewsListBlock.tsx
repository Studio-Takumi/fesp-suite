'use client'

import { createReactBlockSpec, useEditorState } from '@blocknote/react'
import { useQuery } from '@tanstack/react-query'
import { Newspaper } from 'lucide-react'

import { type NewsListProps, parseNewsListTags } from '@fesp/schema'

import type { NewsTag } from '~/lib/mock/news'
import { newsTagsQuery } from '~/lib/queries'

import { ComponentBlockCard } from './ComponentBlockCard'

/** カードに出す設定の要約（1要素1行）。選んだタグはタグの一覧の順に並べ、一覧に無い ID は出さない */
export function summarizeNewsListProps(props: NewsListProps, tags: NewsTag[]): string[] {
    const tagIds = parseNewsListTags(props.tags)
    const tagNames = tags.filter((tag) => tagIds.includes(tag.id)).map((tag) => tag.name)

    return [
        props.showTagTabs
            ? `タグタブ: あり（${tagNames.length > 0 ? tagNames.join('・') : 'タグ未選択'}）`
            : 'タグタブ: なし',
        `表示件数: ${props.limit ?? 'すべて'}`,
        `すべて見る: ${props.showViewAll ? 'あり' : 'なし'}`,
    ]
}

/**
 * お知らせ一覧（`newsList`）。中身を持たない独自コンポーネントのブロックで、props はサイドパネル（ComponentPropsPanel）で編集する。
 * エディタ上ではカードに設定の要約だけを出す（お知らせのプレビューはしない）
 */
export const createNewsListBlock = createReactBlockSpec(
    {
        type: 'newsList',
        propSchema: {
            showTagTabs: { default: true },
            /** タブに出すタグの ID をカンマ区切りで並べた文字列 */
            tags: { default: '' },
            /** 表示件数。未設定なら全件 */
            limit: { default: undefined, type: 'number' },
            showViewAll: { default: false },
        },
        content: 'none',
    },
    {
        render: function NewsListBlock({ block, editor }) {
            const isSelected = useEditorState({
                editor,
                selector: ({ editor }) => editor.getTextCursorPosition().block.id === block.id,
            })
            const tags = useQuery(newsTagsQuery())

            return (
                <ComponentBlockCard icon={<Newspaper size={14} />} name='お知らせ一覧' isSelected={isSelected}>
                    <div className='flex flex-col gap-1 text-sm text-slate-700'>
                        {summarizeNewsListProps(block.props, tags.data ?? []).map((line) => (
                            <div key={line}>{line}</div>
                        ))}
                    </div>
                </ComponentBlockCard>
            )
        },
    },
)
