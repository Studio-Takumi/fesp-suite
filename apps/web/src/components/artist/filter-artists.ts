import type { Artist } from '~/lib/mock/artist'

/** 出演者一覧の並び替え。`performance` は出演の早い順、`name` は出演者名の順 */
export type ArtistSort = 'performance' | 'name'

export type ArtistFilter = {
    /** 選んでいる日（1日目なら `1`）。`null` なら全部合う */
    day: number | null
    /** 検索バーの文字。空なら全部合う */
    keyword: string
    /** 選んでいるタグの ID。`null` なら全部合う */
    tagId: string | null
}

/**
 * 日付・検索の文字・タグのすべてに合う出演者だけを返す。
 * 文字は前後の空白を除き、出演者名・演目・団体名のどれかに含まれていれば合う（英字の大文字・小文字は区別しない）
 */
export function filterArtists(artists: Artist[], { day, keyword, tagId }: ArtistFilter): Artist[] {
    const text = keyword.trim().toLowerCase()

    return artists.filter(
        (artist) =>
            (day === null || artist.day === day) &&
            (tagId === null || artist.tags.some((tag) => tag.id === tagId)) &&
            (text === '' ||
                [artist.name, artist.program, artist.group].some((value) => value.toLowerCase().includes(text))),
    )
}

/** 出演者を並び替える。元の配列は変えない */
export function sortArtists(artists: Artist[], sort: ArtistSort): Artist[] {
    return [...artists].sort((a, b) =>
        sort === 'name' ? a.name.localeCompare(b.name, 'ja') : a.starts_at.localeCompare(b.starts_at),
    )
}
