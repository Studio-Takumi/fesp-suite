import type { MapCategory, MapPlace } from '~/lib/mock/map'

/**
 * 検索バーの文字とカテゴリの両方に合う場所だけを返す。
 * 文字は前後の空白を除き、名前・団体名・会場のどれかに含まれていれば合う（英字の大文字・小文字は区別しない）。
 * 文字が空・カテゴリが `null` なら、その条件は全部合う
 */
export function filterMapPlaces(places: MapPlace[], query: string, category: MapCategory | null): MapPlace[] {
    const keyword = query.trim().toLowerCase()

    return places.filter(
        (place) =>
            (category === null || place.category === category) &&
            (keyword === '' ||
                [place.name, place.group, place.location].some((value) => value.toLowerCase().includes(keyword))),
    )
}
