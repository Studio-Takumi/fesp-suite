/**
 * 出演者の仮データ。出演者の API（#60）ができるまで、`lib/queries.ts` の queryOptions から返す。
 * API ができたら queryFn を差し替え、このファイルは消す
 */

export type ArtistTag = {
    id: string
    name: string
}

export type Artist = {
    id: string
    /** 出演者の写真。無ければ空文字（カードは色の枠を出す） */
    image_url: string
    /** 出演者名（例: `ソラノネ`） */
    name: string
    /** 演目（例: `アコースティックライブ`） */
    program: string
    /** 団体名（例: `軽音楽部`） */
    group: string
    /** 出演する日（1日目なら `1`） */
    day: number
    starts_at: string
    ends_at: string
    /** 会場（例: `体育館ステージ`） */
    venue: string
    /** 人数 */
    member_count: number
    tags: ArtistTag[]
}

/** セットリストの1曲 */
export type SetListSong = {
    id: string
    /** 曲名 */
    title: string
    /** 原曲のアーティスト */
    artist: string
}

/** 仮データの写真（Unsplash）。本物のデータ（#60）が入るまでの見本 */
const photo = (id: string) => `https://images.unsplash.com/${id}?w=1080&q=80`

export const mockArtistTags: ArtistTag[] = [
    { id: 'band', name: 'バンド' },
    { id: 'dance', name: 'ダンス' },
    { id: 'performance', name: '演奏' },
    { id: 'volunteer', name: '有志' },
]

const tag = (id: string): ArtistTag => mockArtistTags.find((t) => t.id === id) ?? { id, name: id }

type ArtistSeed = Omit<Artist, 'starts_at' | 'ends_at' | 'tags'> & {
    date: string
    startsAt: string
    endsAt: string
    tagIds: string[]
}

const artist = ({ date, startsAt, endsAt, tagIds, ...rest }: ArtistSeed): Artist => ({
    ...rest,
    starts_at: `${date}T${startsAt}:00+09:00`,
    ends_at: `${date}T${endsAt}:00+09:00`,
    tags: tagIds.map(tag),
})

/** 表示中の出演者。記事と出演者を結び付ける仕組み（#60・#64）ができるまで、この1件を返す */
export const mockCurrentArtist: Artist = artist({
    id: 'artist-1',
    image_url: photo('photo-1514525253161-7a46d19cd819'),
    name: 'ソラノネ',
    program: 'アコースティックライブ',
    group: '軽音楽部',
    day: 1,
    date: '2026-06-06',
    startsAt: '10:20',
    endsAt: '11:00',
    venue: '体育館ステージ',
    member_count: 5,
    tagIds: ['band', 'performance'],
})

/** 出演者（出演の早い順） */
export const mockArtists: Artist[] = [
    mockCurrentArtist,
    artist({
        id: 'artist-2',
        image_url: photo('photo-1501281668745-f7f57925c3b4'),
        name: 'ハルカゼ団',
        program: '有志ステージ',
        group: '有志',
        day: 1,
        date: '2026-06-06',
        startsAt: '14:02',
        endsAt: '14:30',
        venue: '中庭ステージ',
        member_count: 8,
        tagIds: ['volunteer', 'dance'],
    }),
    artist({
        id: 'artist-3',
        image_url: photo('photo-1459749411175-04bf5292ceea'),
        name: '吹奏楽部',
        program: '吹奏楽コンサート',
        group: '吹奏楽部',
        day: 2,
        date: '2026-06-07',
        startsAt: '10:00',
        endsAt: '11:00',
        venue: '体育館ステージ',
        member_count: 32,
        tagIds: ['performance'],
    }),
    artist({
        id: 'artist-4',
        image_url: photo('photo-1470225620780-dba8ba36b745'),
        name: 'ミント・パレード',
        program: '有志ステージ',
        group: '軽音楽部',
        day: 2,
        date: '2026-06-07',
        startsAt: '13:20',
        endsAt: '13:50',
        venue: '体育館ステージ',
        member_count: 4,
        tagIds: ['band', 'volunteer'],
    }),
    artist({
        id: 'artist-5',
        image_url: photo('photo-1530103862676-de8c9debad1d'),
        name: 'ダンス部',
        program: 'ダンスステージ',
        group: 'ダンス部',
        day: 2,
        date: '2026-06-07',
        startsAt: '14:00',
        endsAt: '14:40',
        venue: '中庭ステージ',
        member_count: 16,
        tagIds: ['dance'],
    }),
]

/** 表示中の出演者（`mockCurrentArtist`）のセットリスト */
export const mockSetList: SetListSong[] = [
    { id: '1', title: 'Take the A Train', artist: 'Duke Ellington' },
    { id: '2', title: 'Fly Me to the Moon', artist: 'Bart Howard' },
    { id: '3', title: 'Sing, Sing, Sing', artist: 'Louis Prima' },
    { id: '4', title: '情熱大陸', artist: '葉加瀬太郎' },
]
