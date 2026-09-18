'use client'

import { createReactBlockSpec, useEditorState } from '@blocknote/react'
import { useQuery } from '@tanstack/react-query'
import { Store } from 'lucide-react'

import { parseShopListTags, type ShopListProps } from '@fesp/schema'

import type { ShopTag } from '~/lib/mock/shop'
import { shopTagsQuery } from '~/lib/queries'

import { ComponentBlockCard } from './ComponentBlockCard'

/** カードに出す設定の要約（1要素1行）。選んだタグはタグの一覧の順に並べ、一覧に無い ID は出さない */
export function summarizeShopListProps(props: ShopListProps, tags: ShopTag[]): string[] {
    const tagIds = parseShopListTags(props.tags)
    const tagNames = tags.filter((tag) => tagIds.includes(tag.id)).map((tag) => tag.name)

    return [
        `日付タブ: ${props.showDateTabs ? 'あり' : 'なし'}`,
        `検索: ${props.showSearch ? 'あり' : 'なし'}`,
        `並び替え: ${props.showSort ? 'あり' : 'なし'}`,
        props.showTagTabs
            ? `タグタブ: あり（${tagNames.length > 0 ? tagNames.join('・') : 'タグ未選択'}）`
            : 'タグタブ: なし',
        `カードの商品: ${props.showProducts ? 'あり' : 'なし'}`,
    ]
}

/**
 * 模擬店一覧（`shopList`）。中身を持たない独自コンポーネントのブロックで、props はサイドパネル（ComponentPropsPanel）で編集する。
 * エディタ上ではカードに設定の要約だけを出す（模擬店のプレビューはしない）
 */
export const createShopListBlock = createReactBlockSpec(
    {
        type: 'shopList',
        propSchema: {
            showDateTabs: { default: true },
            showSearch: { default: true },
            showSort: { default: true },
            showTagTabs: { default: true },
            /** タブに出すタグの ID をカンマ区切りで並べた文字列 */
            tags: { default: '' },
            showProducts: { default: true },
        },
        content: 'none',
    },
    {
        render: function ShopListBlock({ block, editor }) {
            const isSelected = useEditorState({
                editor,
                selector: ({ editor }) => editor.getTextCursorPosition().block.id === block.id,
            })
            const tags = useQuery(shopTagsQuery())

            return (
                <ComponentBlockCard icon={<Store size={14} />} name='模擬店一覧' isSelected={isSelected}>
                    <div className='flex flex-col gap-1 text-sm text-slate-700'>
                        {summarizeShopListProps(block.props, tags.data ?? []).map((line) => (
                            <div key={line}>{line}</div>
                        ))}
                    </div>
                </ComponentBlockCard>
            )
        },
    },
)
