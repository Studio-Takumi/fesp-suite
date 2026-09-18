'use client'

import { createReactBlockSpec, useEditorState } from '@blocknote/react'
import { useQuery } from '@tanstack/react-query'
import { ShoppingBag } from 'lucide-react'

import { parseIdListProp, type ProductListProps } from '@fesp/schema'

import type { ShopProduct } from '~/lib/mock/shop'
import { shopProductsQuery } from '~/lib/queries'

import { ComponentBlockCard } from './ComponentBlockCard'

/** カードに出す設定の要約。選んだ商品は商品の一覧の順に並べ、一覧に無い ID は出さない */
export function summarizeProductListProps(props: ProductListProps, products: ShopProduct[]): string {
    const productIds = parseIdListProp(props.products)
    const names = products.filter((product) => productIds.includes(product.id)).map((product) => product.name)

    return `表示する商品: ${names.length > 0 ? names.join('・') : 'すべて'}`
}

/**
 * 商品一覧（`productList`）。中身を持たない独自コンポーネントのブロックで、props はサイドパネル（ComponentPropsPanel）で編集する。
 * エディタ上ではカードに設定の要約だけを出す（商品のプレビューはしない）
 */
export const createProductListBlock = createReactBlockSpec(
    {
        type: 'productList',
        propSchema: {
            /** 表示する商品の ID をカンマ区切りで並べた文字列。空なら全件 */
            products: { default: '' },
        },
        content: 'none',
    },
    {
        render: function ProductListBlock({ block, editor }) {
            const isSelected = useEditorState({
                editor,
                selector: ({ editor }) => editor.getTextCursorPosition().block.id === block.id,
            })
            const products = useQuery(shopProductsQuery())

            return (
                <ComponentBlockCard icon={<ShoppingBag size={14} />} name='商品一覧' isSelected={isSelected}>
                    <div className='text-sm text-slate-700'>
                        {summarizeProductListProps(block.props, products.data ?? [])}
                    </div>
                </ComponentBlockCard>
            )
        },
    },
)
