/** 一覧の絞り込みの条件。`null`・空文字ならその条件では絞り込まない */
export type ListFilter = {
    /** 選んでいる開催日（1日目なら `1`） */
    day: number | null
    /** 選んでいるタグの ID */
    tagId: string | null
    /** 検索バーの文字 */
    keyword: string
}

/** 一覧の項目から、絞り込みに使う値を取り出す取り決め */
export type ListAccessors<T> = {
    /** その項目の開催日 */
    day: (item: T) => number
    /** その項目に付いているタグの ID */
    tagIds: (item: T) => string[]
    /** 検索の文字と突き合わせる文字列（店名・商品名など） */
    searchTexts: (item: T) => string[]
}

/**
 * 開催日・タグ・検索の文字のすべてに合う項目だけを返す。
 * 文字は前後の空白を除き、`searchTexts` のどれかに含まれていれば合う（英字の大文字・小文字は区別しない）
 */
export function filterList<T>(items: T[], { day, tagId, keyword }: ListFilter, accessors: ListAccessors<T>): T[] {
    const text = keyword.trim().toLowerCase()

    return items.filter(
        (item) =>
            (day === null || accessors.day(item) === day) &&
            (tagId === null || accessors.tagIds(item).includes(tagId)) &&
            (text === '' || accessors.searchTexts(item).some((value) => value.toLowerCase().includes(text))),
    )
}

/** 並び替えの選択肢。`compare` が無ければ読み込んだ順のまま */
export type ListSortDefinition<T> = {
    id: string
    label: string
    compare?: (a: T, b: T) => number
}

/** 選んだ並び替えで項目を並べ替える。元の配列は変えない */
export function sortList<T>(items: T[], sorts: ListSortDefinition<T>[], selectedId: string): T[] {
    const compare = sorts.find((sort) => sort.id === selectedId)?.compare

    return compare ? [...items].sort(compare) : items
}
