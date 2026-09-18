'use client'

import { createReactBlockSpec, useEditorState } from '@blocknote/react'
import { useQuery } from '@tanstack/react-query'
import { BookOpen } from 'lucide-react'

import { type BlogListProps, parseBlogListTags } from '@fesp/schema'

import type { BlogTag } from '~/lib/mock/blog'
import { blogTagsQuery } from '~/lib/queries'

import { ComponentBlockCard } from './ComponentBlockCard'

/** カードに出す設定の要約。選んだタグはタグの一覧の順に並べ、一覧に無い ID は出さない */
export function summarizeBlogListProps(props: BlogListProps, tags: BlogTag[]): string {
    if (!props.showTagTabs) return 'タグタブ: なし'

    const tagIds = parseBlogListTags(props.tags)
    const tagNames = tags.filter((tag) => tagIds.includes(tag.id)).map((tag) => tag.name)

    return `タグタブ: あり（${tagNames.length > 0 ? tagNames.join('・') : 'タグ未選択'}）`
}

/**
 * ブログ一覧（`blogList`）。中身を持たない独自コンポーネントのブロックで、props はサイドパネル（ComponentPropsPanel）で編集する。
 * エディタ上ではカードに設定の要約だけを出す（ブログのプレビューはしない）
 */
export const createBlogListBlock = createReactBlockSpec(
    {
        type: 'blogList',
        propSchema: {
            showTagTabs: { default: true },
            /** タブに出すタグの ID をカンマ区切りで並べた文字列 */
            tags: { default: '' },
        },
        content: 'none',
    },
    {
        render: function BlogListBlock({ block, editor }) {
            const isSelected = useEditorState({
                editor,
                selector: ({ editor }) => editor.getTextCursorPosition().block.id === block.id,
            })
            const tags = useQuery(blogTagsQuery())

            return (
                <ComponentBlockCard icon={<BookOpen size={14} />} name='ブログ一覧' isSelected={isSelected}>
                    <div className='text-sm text-slate-700'>{summarizeBlogListProps(block.props, tags.data ?? [])}</div>
                </ComponentBlockCard>
            )
        },
    },
)
