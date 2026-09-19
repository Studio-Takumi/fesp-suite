type MapSearchInputProps = {
    value: string
    onChange: (value: string) => void
}

/**
 * 場所を絞り込む入力欄。枠とアイコンは置く場所で違う（`md` 未満は地図の上に浮かぶ白い丸枠、
 * `md` 以上は左のパネルの中の `slate-100` の丸枠）ので、入力欄だけを共通にしている
 */
export function MapSearchInput({ value, onChange }: MapSearchInputProps) {
    return (
        <input
            type='search'
            value={value}
            onChange={(event) => onChange(event.target.value)}
            placeholder='場所・模擬店を検索'
            aria-label='場所・模擬店を検索'
            className='min-w-0 flex-1 bg-transparent text-sm text-slate-900 outline-none placeholder:text-slate-400'
        />
    )
}
