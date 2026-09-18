/**
 * ブログの仮データ。ブログの API（#57）ができるまで、`lib/queries.ts` の queryOptions から返す。
 * API ができたら queryFn を差し替え、このファイルは消す
 */

export type BlogTag = {
    id: string
    name: string
}

/** ブログのタグ。ウェブアプリの仮データ（apps/web/src/lib/mock/blog.ts）と ID を揃える */
export const mockBlogTags: BlogTag[] = [
    { id: 'prep', name: '準備' },
    { id: 'day', name: '当日' },
    { id: 'behind', name: '裏側' },
    { id: 'review', name: '振り返り' },
]
