/**
 * マップ（独自コンポーネント `map`）の仮データ。
 * 本物の API（`map_pins` など、#61）ができたら `lib/queries.ts` の `mapQuery` ごと差し替える
 */

export type MapCategory = 'home' | 'food' | 'experience' | 'stage'

export type MapPlace = {
    id: string
    name: string
    /** 出している団体（クラス・部活など） */
    group: string
    /** 会場（例: `特A教室`） */
    location: string
    category: MapCategory
    /** 開催日（1日目なら `1`） */
    day: number
}

export type MapData = {
    /** 上の階から並べる */
    floors: string[]
    places: MapPlace[]
}

export const mapMock: MapData = {
    floors: ['3F', '2F', '1F'],
    places: [
        { id: '1', name: 'レモネードスタンド', group: '2年1組', location: '特A教室', category: 'food', day: 1 },
        { id: '2', name: 'チュロス', group: '1年3組', location: '中庭ブース', category: 'food', day: 1 },
        { id: '3', name: '射的横丁', group: '3年2組', location: '第2校舎 1F', category: 'experience', day: 2 },
        {
            id: '4',
            name: '総合案内',
            group: '文化祭実行委員会',
            location: '本校舎 1F 昇降口',
            category: 'home',
            day: 1,
        },
        { id: '5', name: '軽音楽部ライブ', group: '軽音楽部', location: '体育館', category: 'stage', day: 2 },
        { id: '6', name: 'お化け屋敷', group: '2年4組', location: '本校舎 3F', category: 'experience', day: 1 },
        { id: '7', name: 'たこ焼き', group: '3年1組', location: '中庭ブース', category: 'food', day: 2 },
        { id: '8', name: '救護室', group: '保健委員会', location: '本校舎 1F 保健室', category: 'home', day: 1 },
    ],
}
