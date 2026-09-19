import { useState } from 'react'

import { useQuery } from '@tanstack/react-query'
import { Layers, LocateFixed, Search } from 'lucide-react'

import { QueryBoundary } from '~/components/QueryBoundary'
import type { MapCategory } from '~/lib/mock/map'
import { mapQuery } from '~/lib/queries'
import { tabletMediaQuery, useMediaQuery } from '~/lib/use-media-query'

import type { BlockComponentProps } from '../block-registry'
import { filterMapPlaces } from './map/filter-map-places'
import { MapBottomSheet } from './map/MapBottomSheet'
import { MapCategoryTabs } from './map/MapCategoryTabs'
import { MapFloorSwitch } from './map/MapFloorSwitch'
import { MapPlaceList } from './map/MapPlaceList'
import { MapSearchInput } from './map/MapSearchInput'
import { MapSidePanel } from './map/MapSidePanel'

/**
 * マップ（独自コンポーネント `map`）。会場のマップを1ページ分、画面の高さいっぱいに出す。props は持たない。
 * 地図の面は今は白一色で、校舎の図形やピンは描かない。
 * 検索バーの文字とカテゴリのタブで場所の一覧を絞り込む。フロア切替は選択の見た目だけ、現在地ボタンは見た目だけ。
 * 幅が足りていれば、検索バーとボトムシートの代わりに左のパネルを出す（docs/app.md）
 */
export function Map({ children }: BlockComponentProps) {
    const map = useQuery(mapQuery())
    const isTablet = useMediaQuery(tabletMediaQuery)
    const [query, setQuery] = useState('')
    const [category, setCategory] = useState<MapCategory | null>(null)
    const [selectedFloor, setSelectedFloor] = useState<string | null>(null)

    const floors = map.data?.floors ?? []
    const categoryTabs = <MapCategoryTabs selectedCategory={category} onSelect={setCategory} />
    const placeList = (
        <QueryBoundary isPending={map.isPending} error={map.error} data={map.data}>
            {(data) => <MapPlaceList places={filterMapPlaces(data.places, query, category)} />}
        </QueryBoundary>
    )

    return (
        <>
            {/* `md` 以上は本文の領域（`AppShell` の `main`）いっぱいに敷く。中身が絶対配置なので、
                高さを親から受け取れる形にしないと潰れてしまう */}
            <section
                aria-label='マップ'
                className='relative h-dvh overflow-hidden bg-white md:absolute md:inset-0 md:h-auto'
            >
                {!isTablet && (
                    <div className='absolute inset-x-4 top-4 flex h-12 items-center gap-3 rounded-full bg-white px-5 shadow-md'>
                        <Search size={20} aria-hidden className='shrink-0 text-slate-400' />
                        <MapSearchInput value={query} onChange={setQuery} />
                        <Layers size={20} aria-hidden className='shrink-0 text-slate-500' />
                    </div>
                )}

                {floors.length > 0 && (
                    <div className='absolute top-20 right-4 md:top-6 md:right-6'>
                        <MapFloorSwitch
                            floors={floors}
                            // 選んでいなければ一番下の階
                            selectedFloor={selectedFloor ?? floors.at(-1)!}
                            onSelect={setSelectedFloor}
                        />
                    </div>
                )}

                <button
                    type='button'
                    aria-label='現在地'
                    className='absolute top-56 right-4 flex size-11 items-center justify-center rounded-full bg-white text-sky-500 shadow-md md:top-44 md:right-6'
                >
                    <LocateFixed size={20} aria-hidden />
                </button>

                {isTablet ? (
                    <MapSidePanel query={query} onQueryChange={setQuery} header={categoryTabs}>
                        {placeList}
                    </MapSidePanel>
                ) : (
                    <MapBottomSheet header={categoryTabs}>{placeList}</MapBottomSheet>
                )}
            </section>
            {children}
        </>
    )
}
