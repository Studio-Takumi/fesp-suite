/**
 * ブログの仮データ。ブログの API（#57）ができるまで、`lib/queries.ts` の queryOptions から返す。
 * API ができたら queryFn を差し替え、このファイルは消す
 */

export type BlogTag = {
    id: string
    name: string
}

export type BlogPost = {
    id: string
    title: string
    /** 一覧に出す抜粋 */
    excerpt: string
    /** 作成者の表示名 */
    author: string
    /** サムネイルの URL。無ければ空文字 */
    image_url: string
    published_at: string
    tags: BlogTag[]
}

/** 関連する記事。一覧には抜粋・投稿者を出さないので持たない */
export type RelatedPost = Pick<BlogPost, 'id' | 'title' | 'image_url' | 'published_at'>

export const mockBlogTags: BlogTag[] = [
    { id: 'prep', name: '準備' },
    { id: 'day', name: '当日' },
    { id: 'behind', name: '裏側' },
    { id: 'review', name: '振り返り' },
]

const tag = (id: string): BlogTag => mockBlogTags.find((t) => t.id === id) ?? { id, name: id }

/** ブログ（新しい順） */
export const mockBlogPosts: BlogPost[] = [
    {
        id: 'blog-5',
        title: '準備期間の裏側をのぞいてみた',
        excerpt:
            '開催まであと3日。各クラスの教室では朝から夜まで作業が続いています。今年いちばん気合いの入った装飾はどこか、編集部が歩いてきました。',
        author: '広報委員会',
        image_url: 'https://images.unsplash.com/photo-1678964335849-30d96ce65870?w=1080&q=80',
        published_at: '2026-06-02T18:30:00+09:00',
        tags: [tag('prep')],
    },
    {
        id: 'blog-4',
        title: '今年のテーマが決まるまで',
        excerpt: '300以上集まった案の中からどうやって1つに絞ったのか。テーマ決定までの3ヶ月を振り返ります。',
        author: '実行委員会本部',
        image_url: 'https://images.unsplash.com/photo-1619634579871-5aacd9a0087a?w=1080&q=80',
        published_at: '2026-05-28T12:00:00+09:00',
        tags: [tag('behind')],
    },
    {
        id: 'blog-3',
        title: 'ステージ企画のリハーサルに潜入',
        excerpt: '本番と同じ照明・音響でのリハーサル。出演者たちの表情を追いました。',
        author: '広報委員会',
        image_url: 'https://images.unsplash.com/photo-1656281144468-a8643338ba35?w=1080&q=80',
        published_at: '2026-05-20T17:00:00+09:00',
        tags: [tag('day')],
    },
    {
        id: 'blog-2',
        title: '模擬店の仕込みは前日から始まる',
        excerpt: '当日の朝だけでは間に合わない。前日の調理室をのぞいてきました。',
        author: '広報委員会',
        image_url: '',
        published_at: '2026-05-14T09:30:00+09:00',
        tags: [tag('prep'), tag('day')],
    },
    {
        id: 'blog-1',
        title: '去年の文化祭をふりかえる',
        excerpt: '写真とともに、去年いちばん盛り上がった企画をふりかえります。',
        author: '実行委員会本部',
        image_url: 'https://images.unsplash.com/photo-1642979915500-97efdb9c63a1?w=1080&q=80',
        published_at: '2026-05-07T15:00:00+09:00',
        tags: [tag('review')],
    },
]

/**
 * 表示中の記事に関連する記事。関連する記事を何で決めるか（タグ・手動）は #57 で決めるので、
 * ここではデザインの2件をそのまま返す
 */
export const mockRelatedPosts: RelatedPost[] = [mockBlogPosts[1]!, mockBlogPosts[2]!].map(
    ({ id, title, image_url, published_at }) => ({ id, title, image_url, published_at }),
)
