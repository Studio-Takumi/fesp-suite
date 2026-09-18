/**
 * 模擬店の仮データ（開催日・タグ・模擬店・表示中の模擬店の商品）。模擬店の API（#59）ができるまで、
 * `lib/queries.ts` の queryOptions から返す。API ができたら queryFn を差し替え、このファイルは消す
 */

export type ShopTag = {
    id: string
    name: string
}

/** 開催日。1日目から順に並べる */
export type ShopDay = {
    /** 開催日（1日目なら `1`） */
    day: number
    /** 日付（`YYYY-MM-DD`） */
    date: string
}

/** 模擬店の色。カードの枠・Dayバッジ・商品のサムネに使う */
export type ShopColor = 'rose' | 'amber' | 'emerald' | 'sky'

export type ShopProduct = {
    id: string
    name: string
    /** 価格（円） */
    price: number
    /** 商品の画像。無ければ `null` */
    image_url: string | null
}

export type Shop = {
    id: string
    name: string
    /** 模擬店の写真。無ければ空文字（カードは色の枠を出す） */
    image_url: string
    /** 出している団体（クラス・部活など） */
    group: string
    /** 場所（例: `特別教室A`） */
    location: string
    /** 開催日（1日目なら `1`） */
    day: number
    /** タグ（食べ物・体験など）の ID */
    tag_id: string
    color: ShopColor
    starts_at: string
    ends_at: string
    products: ShopProduct[]
}

export const mockShopDays: ShopDay[] = [
    { day: 1, date: '2026-06-06' },
    { day: 2, date: '2026-06-07' },
]

export const mockShopTags: ShopTag[] = [
    { id: 'food', name: '食べ物' },
    { id: 'experience', name: '体験' },
    { id: 'exhibit', name: '展示' },
    { id: 'goods', name: '物販' },
]

/** 仮データの写真（Unsplash）。本物のデータ（#59）が入るまでの見本 */
const photo = (id: string) => `https://images.unsplash.com/${id}?w=1080&q=80`

const product = (id: string, name: string, price: number, photoId?: string): ShopProduct => ({
    id,
    name,
    price,
    image_url: photoId ? photo(photoId) : null,
})

export const mockShops: Shop[] = [
    {
        id: 'shop-1',
        image_url: photo('photo-1527661591475-527312dd65f5'),
        name: 'レモネードスタンド',
        group: '2年1組',
        location: '特別教室A',
        day: 1,
        tag_id: 'food',
        color: 'rose',
        starts_at: '2026-06-06T09:10:00+09:00',
        ends_at: '2026-06-06T14:30:00+09:00',
        products: [
            product('product-1', 'レモネード', 200, 'photo-1621263764928-df1444c5e859'),
            product('product-2', 'ピンクレモネード', 200, 'photo-1497534446932-c925b458314e'),
            product('product-3', 'はちみつレモン', 150, 'photo-1600271886742-f049cd451bba'),
            product('product-4', 'レモンスカッシュ', 250),
        ],
    },
    {
        id: 'shop-2',
        image_url: photo('photo-1567620905732-2d1ec7ab7445'),
        name: 'クレープ屋さん',
        group: '1年5組',
        location: '1年5組教室',
        day: 1,
        tag_id: 'food',
        color: 'amber',
        starts_at: '2026-06-06T09:40:00+09:00',
        ends_at: '2026-06-06T15:00:00+09:00',
        products: [
            product('product-5', 'チョコクレープ', 300, 'photo-1567620905732-2d1ec7ab7445'),
            product('product-6', 'いちごクレープ', 350, 'photo-1519676867240-f03562e64548'),
            product('product-7', 'ツナクレープ', 300, 'photo-1558961363-fa8fdf82db35'),
        ],
    },
    {
        id: 'shop-3',
        image_url: photo('photo-1533900298318-6b8da08a523e'),
        name: '射的横丁',
        group: '3年2組',
        location: '第2校舎 1F',
        day: 2,
        tag_id: 'experience',
        color: 'emerald',
        starts_at: '2026-06-07T10:00:00+09:00',
        ends_at: '2026-06-07T14:00:00+09:00',
        products: [product('product-8', '射的（5発）', 100), product('product-9', '射的（10発）', 180)],
    },
    {
        id: 'shop-4',
        image_url: photo('photo-1524230572899-a752b3835840'),
        name: 'お化け屋敷',
        group: '2年4組',
        location: '本校舎 3F',
        day: 1,
        tag_id: 'experience',
        color: 'sky',
        starts_at: '2026-06-06T09:40:00+09:00',
        ends_at: '2026-06-06T15:00:00+09:00',
        products: [product('product-10', '入場（1人）', 100)],
    },
    {
        id: 'shop-5',
        image_url: photo('photo-1502920917128-1aa500764cbd'),
        name: '写真部展示',
        group: '写真部',
        location: '第2校舎 2F',
        day: 2,
        tag_id: 'exhibit',
        color: 'amber',
        starts_at: '2026-06-07T09:30:00+09:00',
        ends_at: '2026-06-07T15:30:00+09:00',
        products: [],
    },
    {
        id: 'shop-6',
        image_url: '',
        name: '文化祭Tシャツ',
        group: '文化祭実行委員会',
        location: '本校舎 1F 昇降口',
        day: 2,
        tag_id: 'goods',
        color: 'rose',
        starts_at: '2026-06-07T09:00:00+09:00',
        ends_at: '2026-06-07T15:00:00+09:00',
        products: [
            product('product-11', 'Tシャツ', 1200, 'photo-1521572163474-6864f9cf17ab'),
            product('product-12', 'タオル', 800),
        ],
    },
]

/** 表示中の模擬店。記事と模擬店を結び付ける仕組み（#59・#64）ができるまで、この1件を返す */
export const mockCurrentShop: Shop = mockShops[0]!
