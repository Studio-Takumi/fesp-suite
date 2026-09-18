/**
 * 出演者の仮データ。出演者の API（#60）ができるまで、`lib/queries.ts` の queryOptions から返す。
 * API ができたら queryFn を差し替え、このファイルは消す
 */

export type ArtistTag = {
    id: string
    name: string
}

/** 出演者のタグ。ウェブアプリの仮データ（apps/web/src/lib/mock/artist.ts）と ID を揃える */
export const mockArtistTags: ArtistTag[] = [
    { id: 'band', name: 'バンド' },
    { id: 'dance', name: 'ダンス' },
    { id: 'performance', name: '演奏' },
    { id: 'volunteer', name: '有志' },
]
