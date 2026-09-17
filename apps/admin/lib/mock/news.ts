/**
 * お知らせの仮データ。お知らせの API（#56）ができるまで、`lib/queries.ts` の queryOptions から返す。
 * API ができたら queryFn を差し替え、このファイルは消す
 */

export type NewsTag = {
    id: string
    name: string
}

/** お知らせのタグ。ウェブアプリの仮データ（apps/web/src/lib/mock/news.ts）と ID を揃える */
export const mockNewsTags: NewsTag[] = [
    { id: 'stage', name: 'ステージ' },
    { id: 'shop', name: '模擬店' },
    { id: 'eve', name: '前夜祭' },
    { id: 'request', name: 'お願い' },
    { id: 'notice', name: 'お知らせ' },
]
