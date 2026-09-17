/**
 * お知らせの仮データ。お知らせの API（#56）ができるまで、`lib/queries.ts` の queryOptions から返す。
 * API ができたら queryFn を差し替え、このファイルは消す
 */

export type NewsTag = {
    id: string
    name: string
}

export type NewsPost = {
    id: string
    title: string
    /** 作成者の表示名 */
    author: string
    published_at: string
    updated_at: string
    tags: NewsTag[]
}

/** 前の記事・次の記事。無ければ `null` */
export type AdjacentPosts = {
    /** 1つ古い記事 */
    previous: Pick<NewsPost, 'id' | 'title'> | null
    /** 1つ新しい記事 */
    next: Pick<NewsPost, 'id' | 'title'> | null
}

export const mockNewsTags: NewsTag[] = [
    { id: 'stage', name: 'ステージ' },
    { id: 'shop', name: '模擬店' },
    { id: 'eve', name: '前夜祭' },
    { id: 'request', name: 'お願い' },
    { id: 'notice', name: 'お知らせ' },
]

const tag = (id: string): NewsTag => mockNewsTags.find((t) => t.id === id) ?? { id, name: id }

/** 表示中の記事。記事とお知らせを結び付ける仕組み（#56・#64）ができるまで、この1件を返す */
export const mockCurrentPost: NewsPost = {
    id: 'news-7',
    title: '2日目のタイムテーブルを更新しました',
    author: '実行委員会本部',
    published_at: '2026-06-06T11:30:00+09:00',
    updated_at: '2026-06-06T11:51:00+09:00',
    tags: [tag('stage'), tag('notice')],
}

/** お知らせ（新しい順） */
export const mockNewsPosts: NewsPost[] = [
    {
        id: 'news-8',
        title: '模擬店の整理券について',
        author: '実行委員会本部',
        published_at: '2026-06-06T13:10:00+09:00',
        updated_at: '2026-06-06T13:10:00+09:00',
        tags: [tag('shop')],
    },
    mockCurrentPost,
    {
        id: 'news-6',
        title: 'こまめに水分補給をしてください',
        author: '保健委員会',
        published_at: '2026-06-06T09:00:00+09:00',
        updated_at: '2026-06-06T09:00:00+09:00',
        tags: [tag('request')],
    },
    {
        id: 'news-5',
        title: '中庭ステージの開始時刻が変わりました',
        author: '実行委員会本部',
        published_at: '2026-06-06T08:15:00+09:00',
        updated_at: '2026-06-06T08:15:00+09:00',
        tags: [tag('stage')],
    },
    {
        id: 'news-4',
        title: '前夜祭の入場方法について',
        author: '実行委員会本部',
        published_at: '2026-06-05T18:00:00+09:00',
        updated_at: '2026-06-05T18:00:00+09:00',
        tags: [tag('eve')],
    },
    {
        id: 'news-3',
        title: 'フォトコンテストの応募について',
        author: '広報委員会',
        published_at: '2026-06-04T12:00:00+09:00',
        updated_at: '2026-06-04T12:00:00+09:00',
        tags: [tag('notice')],
    },
    {
        id: 'news-2',
        title: '落とし物をお預かりしています',
        author: '実行委員会本部',
        published_at: '2026-06-03T16:00:00+09:00',
        updated_at: '2026-06-03T16:00:00+09:00',
        tags: [tag('request')],
    },
    {
        id: 'news-1',
        title: '駐輪場の場所が変わりました',
        author: '装飾委員会',
        published_at: '2026-06-03T10:00:00+09:00',
        updated_at: '2026-06-03T10:00:00+09:00',
        tags: [tag('request')],
    },
]

/** 表示中の記事（`mockCurrentPost`）の前後 */
export const mockAdjacentPosts: AdjacentPosts = {
    previous: { id: 'news-6', title: 'こまめに水分補給をしてください' },
    next: { id: 'news-8', title: '模擬店の整理券について' },
}
