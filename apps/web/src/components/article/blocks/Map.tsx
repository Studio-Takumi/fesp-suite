import { useState } from 'react'

import { useQuery } from '@tanstack/react-query'
import { Layers, LocateFixed, Search } from 'lucide-react'

import { QueryBoundary } from '~/components/QueryBoundary'
import type { MapCategory } from '~/lib/mock/map'
import { mapQuery } from '~/lib/queries'

import type { BlockComponentProps } from '../block-registry'
import { filterMapPlaces } from './map/filter-map-places'
import { MapBottomSheet } from './map/MapBottomSheet'
import { MapCategoryTabs } from './map/MapCategoryTabs'
import { MapFloorSwitch } from './map/MapFloorSwitch'
import { MapPlaceList } from './map/MapPlaceList'

/**
 * マップ（独自コンポーネント `map`）。会場のマップを1ページ分、画面の高さいっぱいに出す。props は持たない。
 * 地図の面は今は白一色で、校舎の図形やピンは描かない。
 * 検索バーの文字とカテゴリのタブで、ボトムシートの場所の一覧を絞り込む。フロア切替は選択の見た目だけ、現在地ボタンは見た目だけ
 */
export function Map({ children }: BlockComponentProps) {
    const map = useQuery(mapQuery())
    const [query, setQuery] = useState('')
    const [category, setCategory] = useState<MapCategory | null>(null)
    const [selectedFloor, setSelectedFloor] = useState<string | null>(null)

    const floors = map.data?.floors ?? []

    return (
        <>
            <section aria-label='マップ' className='relative h-dvh overflow-hidden bg-white'>
                <div className='absolute inset-x-4 top-4 flex h-12 items-center gap-3 rounded-full bg-white px-5 shadow-md'>
                    <Search size={20} aria-hidden className='shrink-0 text-slate-400' />
                    <input
                        type='search'
                        value={query}
                        onChange={(event) => setQuery(event.target.value)}
                        placeholder='場所・模擬店を検索'
                        aria-label='場所・模擬店を検索'
                        className='min-w-0 flex-1 bg-transparent text-sm text-slate-900 outline-none placeholder:text-slate-400'
                    />
                    <Layers size={20} aria-hidden className='shrink-0 text-slate-500' />
                </div>

                {floors.length > 0 && (
                    <div className='absolute top-20 right-4'>
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
                    className='absolute top-56 right-4 flex size-11 items-center justify-center rounded-full bg-white text-sky-500 shadow-md'
                >
                    <LocateFixed size={20} aria-hidden />
                </button>

                <MapBottomSheet header={<MapCategoryTabs selectedCategory={category} onSelect={setCategory} />}>
                    <QueryBoundary isPending={map.isPending} error={map.error} data={map.data}>
                        {(data) => <MapPlaceList places={filterMapPlaces(data.places, query, category)} />}
                    </QueryBoundary>
                </MapBottomSheet>
            </section>
            {children}
        </>
    )
}
