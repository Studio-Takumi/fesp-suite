import { cn } from '@fesp/ui'

import type { Shop } from '~/lib/mock/shop'

import { shopColors } from './shop-colors'

/** カードの中に出す商品の数 */
const VISIBLE_PRODUCTS = 3

export type ShopCardProps = {
    shop: Shop
    /** カードの中に商品のサムネを出すか */
    showProducts: boolean
}

/** 模擬店一覧の1枚（デザインの ShopCard）。上に模擬店の色の枠、下に団体名・店名・商品のサムネ */
export function ShopCard({ shop, showProducts }: ShopCardProps) {
    const color = shopColors[shop.color]

    return (
        <a href={`/shops/${shop.id}`} className='flex flex-col gap-3'>
            <div
                className={cn(
                    'relative flex h-44 flex-col items-center justify-center gap-3 overflow-hidden rounded-2xl',
                    color.surface,
                )}
            >
                <span className={cn('absolute top-0 left-0 size-16 rounded-br-full', color.accent)} aria-hidden />
                <span className='flex size-20 items-center justify-center rounded-full bg-white/60'>
                    <span className={cn('text-4xl', color.accentText)}>{[...shop.name][0]}</span>
                </span>
                <span className='text-lg font-bold text-slate-900'>{shop.name}</span>
            </div>
            <div className='flex flex-col gap-2'>
                <div className='flex flex-wrap items-center gap-2 text-xs text-slate-500'>
                    <span className={cn('rounded-full px-3 py-1 font-bold text-white', color.accent)}>
                        Day{shop.day}
                    </span>
                    <span>{shop.group}</span>
                    <span>@ {shop.location}</span>
                </div>
                <span className='text-lg leading-snug font-bold text-slate-900'>{shop.name}</span>
                {showProducts && shop.products.length > 0 && (
                    <div className='flex gap-2'>
                        {shop.products.slice(0, VISIBLE_PRODUCTS).map((product, index) => (
                            <div
                                key={product.id}
                                className={cn(
                                    'relative flex size-24 items-center justify-center rounded-xl',
                                    color.surface,
                                )}
                            >
                                <span
                                    className={cn('absolute top-0 left-0 size-8 rounded-br-full', color.accent)}
                                    aria-hidden
                                />
                                <span className='flex size-12 items-center justify-center rounded-full bg-white/60'>
                                    <span className={cn('text-xl', color.accentText)}>{index + 1}</span>
                                </span>
                                <span className='absolute bottom-2 left-2 rounded-lg bg-white px-2 py-1 text-xs font-semibold text-slate-900'>
                                    {product.price}円
                                </span>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </a>
    )
}
