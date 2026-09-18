import { useQuery } from '@tanstack/react-query'

import { parseIdListProp, productListPropsSchema } from '@fesp/schema'
import { cn } from '@fesp/ui'

import { EmptyState } from '~/components/EmptyState'
import { cardColors } from '~/components/list/card-color'
import { QueryBoundary } from '~/components/QueryBoundary'
import { currentShopQuery } from '~/lib/queries'

import type { BlockComponentProps } from '../block-registry'

/**
 * 商品一覧（独自コンポーネント `productList`）。表示中の模擬店の商品を2列に並べる。
 * 表示する商品（`products`）が空なら全件出す。0件なら一覧の空状態を出す
 */
export function ProductList({ block, children }: BlockComponentProps) {
    // 記事は取得時に検証済みだが、型は `Record<string, unknown>` なのでここで props の型にする
    const props = productListPropsSchema.safeParse(block.props)
    const shop = useQuery(currentShopQuery())

    if (!props.success) return <>{children}</>
    const productIds = parseIdListProp(props.data.products)

    return (
        <>
            <section aria-label='商品' className='flex flex-col gap-3'>
                <h2 className='text-base font-bold text-slate-900'>メニュー</h2>
                <QueryBoundary isPending={shop.isPending} error={shop.error} data={shop.data}>
                    {(data) => {
                        // 選んだ商品は、商品の並び順に出す。選んでいなければ全件
                        const visible =
                            productIds.length === 0
                                ? data.products
                                : data.products.filter((product) => productIds.includes(product.id))
                        const color = cardColors[data.color]

                        return visible.length === 0 ? (
                            <EmptyState
                                title='商品はまだありません'
                                description='商品が登録されると、ここに表示されます。'
                                onRetry={() => void shop.refetch()}
                            />
                        ) : (
                            <ul className='grid grid-cols-2 gap-3'>
                                {visible.map((product) => (
                                    <li key={product.id} className='flex flex-col gap-2'>
                                        {product.image_url ? (
                                            <img
                                                src={product.image_url}
                                                alt=''
                                                className='aspect-square w-full rounded-xl object-cover'
                                            />
                                        ) : (
                                            <div
                                                className={cn(
                                                    'flex aspect-square w-full items-center justify-center rounded-xl',
                                                    color.surface,
                                                )}
                                            >
                                                <span className='flex size-14 items-center justify-center rounded-full bg-white/60'>
                                                    <span className={cn('text-2xl', color.accentText)}>
                                                        {[...product.name][0]}
                                                    </span>
                                                </span>
                                            </div>
                                        )}
                                        <span className='text-sm leading-snug font-medium text-slate-900'>
                                            {product.name}
                                        </span>
                                        <span className='text-base font-semibold text-slate-900'>
                                            {product.price}円
                                        </span>
                                    </li>
                                ))}
                            </ul>
                        )
                    }}
                </QueryBoundary>
            </section>
            {children}
        </>
    )
}
