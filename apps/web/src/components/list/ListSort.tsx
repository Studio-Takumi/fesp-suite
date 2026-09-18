import { ChevronDown } from 'lucide-react'

export type ListSortOption = { id: string; label: string }

export type ListSortProps = {
    options: ListSortOption[]
    value: string
    onChange: (value: string) => void
}

/** 一覧の並び替え（丸い枠の中の選択） */
export function ListSort({ options, value, onChange }: ListSortProps) {
    return (
        <div className='relative flex h-9 shrink-0 items-center rounded-full bg-slate-100'>
            <select
                value={value}
                onChange={(event) => onChange(event.target.value)}
                aria-label='並び替え'
                className='appearance-none bg-transparent py-2 pr-9 pl-4 text-sm text-slate-700 outline-none'
            >
                {options.map((option) => (
                    <option key={option.id} value={option.id}>
                        {option.label}
                    </option>
                ))}
            </select>
            <ChevronDown size={16} aria-hidden className='pointer-events-none absolute right-3 text-slate-500' />
        </div>
    )
}
