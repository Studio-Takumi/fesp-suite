import { Search } from 'lucide-react'

export type ListSearchProps = {
    value: string
    onChange: (value: string) => void
    /** 入力欄のプレースホルダ。読み上げのラベルにも使う（例: `店名・商品で検索`） */
    placeholder: string
}

/** 一覧の検索欄（虫めがねのアイコンと入力欄を丸い枠に入れる） */
export function ListSearch({ value, onChange, placeholder }: ListSearchProps) {
    return (
        <div className='flex h-9 min-w-0 flex-1 items-center gap-2 rounded-full bg-slate-100 px-4'>
            <Search size={16} aria-hidden className='shrink-0 text-slate-400' />
            <input
                type='search'
                value={value}
                onChange={(event) => onChange(event.target.value)}
                placeholder={placeholder}
                aria-label={placeholder}
                className='min-w-0 flex-1 bg-transparent text-sm text-slate-900 outline-none placeholder:text-slate-400'
            />
        </div>
    )
}
