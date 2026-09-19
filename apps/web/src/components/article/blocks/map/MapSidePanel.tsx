import type { ReactNode } from 'react'

import { Search } from 'lucide-react'

import { MapSearchInput } from './MapSearchInput'

type MapSidePanelProps = {
    query: string
    onQueryChange: (value: string) => void
    /** 検索バーの下、常に見える部分（カテゴリのタブ） */
    header: ReactNode
    /** 場所の一覧。長いときはこの中だけスクロールする */
    children: ReactNode
}

/**
 * 地図の左に浮かぶパネル（`md` 以上でボトムシートの代わりに出す）。
 * ボトムシートと違って開閉はせず、常に開いている
 */
export function MapSidePanel({ query, onQueryChange, header, children }: MapSidePanelProps) {
    return (
        <div
            role='region'
            aria-label='場所のパネル'
            className='absolute inset-y-5 left-5 flex w-90 flex-col rounded-2xl bg-white shadow-lg'
        >
            <header className='flex flex-col gap-1 px-5 pt-5'>
                <p className='font-en text-xs font-bold tracking-widest text-sky-500 uppercase'>MAP</p>
                <h1 className='font-jp text-3xl leading-snug font-bold text-slate-900'>マップ</h1>
            </header>

            <div className='px-5 py-3'>
                <div className='flex h-11 items-center gap-3 rounded-full bg-slate-100 px-4'>
                    <Search size={18} aria-hidden className='shrink-0 text-slate-400' />
                    <MapSearchInput value={query} onChange={onQueryChange} />
                </div>
            </div>

            {header}

            <div className='min-h-0 flex-1 overflow-y-auto px-4 pb-4'>{children}</div>
        </div>
    )
}
