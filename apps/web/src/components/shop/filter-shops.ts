import type { Shop } from '~/lib/mock/shop'

/** 並び替えの種類。`recommended` は読み込んだ順、`name` は店名の五十音順 */
export type ShopSort = 'recommended' | 'name'

export const shopSortOptions: { id: ShopSort; label: string }[] = [
    { id: 'recommended', label: 'おすすめ順' },
    { id: 'name', label: '名前順' },
]

type ShopFilter = {
    /** 選んでいる開催日。選んでいなければ `null` */
    day: number | null
    /** 選んでいるタグの ID。選んでいなければ `null` */
    tagId: string | null
    /** 検索バーの文字 */
    query: string
}

/**
 * 開催日・タグ・検索バーの文字のすべてに合う模擬店だけを返す。
 * 文字は前後の空白を除き、店名・団体名・場所・商品名のどれかに含まれていれば合う（英字の大文字・小文字は区別しない）。
 * 開催日・タグが `null`、文字が空なら、その条件は全部合う
 */
export function filterShops(shops: Shop[], { day, tagId, query }: ShopFilter): Shop[] {
    const keyword = query.trim().toLowerCase()

    return shops.filter(
        (shop) =>
            (day === null || shop.day === day) &&
            (tagId === null || shop.tag_id === tagId) &&
            (keyword === '' ||
                [shop.name, shop.group, shop.location, ...shop.products.map((product) => product.name)].some((value) =>
                    value.toLowerCase().includes(keyword),
                )),
    )
}

/** 模擬店を並び替える。おすすめ順は読み込んだ順のまま */
export function sortShops(shops: Shop[], sort: ShopSort): Shop[] {
    return sort === 'name' ? [...shops].sort((a, b) => a.name.localeCompare(b.name, 'ja')) : shops
}
