/**
 * 模擬店の仮データ。模擬店の API（#59）ができるまで、`lib/queries.ts` の queryOptions から返す。
 * API ができたら queryFn を差し替え、このファイルは消す
 */

export type ShopTag = {
    id: string
    name: string
}

export type ShopProduct = {
    id: string
    name: string
}

/** 模擬店のタグ。ウェブアプリの仮データ（apps/web/src/lib/mock/shop.ts）と ID を揃える */
export const mockShopTags: ShopTag[] = [
    { id: 'food', name: '食べ物' },
    { id: 'experience', name: '体験' },
    { id: 'exhibit', name: '展示' },
    { id: 'goods', name: '物販' },
]

/** 表示中の模擬店の商品。ウェブアプリの仮データ（apps/web/src/lib/mock/shop.ts）と ID を揃える */
export const mockShopProducts: ShopProduct[] = [
    { id: 'product-1', name: 'レモネード' },
    { id: 'product-2', name: 'ピンクレモネード' },
    { id: 'product-3', name: 'はちみつレモン' },
    { id: 'product-4', name: 'レモンスカッシュ' },
]
