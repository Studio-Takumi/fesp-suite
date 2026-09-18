import { cn } from '@fesp/ui'

/** 「すべて」のタブの ID。絞り込まない状態を表す */
export const ALL_TAB = 'all'

export type ListTagTabsProps = {
    /** 「すべて」の後ろに並べるタグ */
    tabs: { id: string; name: string }[]
    /** 選んでいるタブの ID */
    selected: string
    onSelect: (id: string) => void
}

/** 一覧のタグのタブ（先頭に「すべて」）。選んでいるタブは太字にして下に水色の線を引く */
export function ListTagTabs({ tabs, selected, onSelect }: ListTagTabsProps) {
    return (
        <div role='tablist' aria-label='タグ' className='flex gap-5 overflow-x-auto border-b border-slate-200'>
            {[{ id: ALL_TAB, name: 'すべて' }, ...tabs].map((tab) => {
                const isSelected = tab.id === selected
                return (
                    <button
                        key={tab.id}
                        type='button'
                        role='tab'
                        aria-selected={isSelected}
                        onClick={() => onSelect(tab.id)}
                        className={cn(
                            '-mb-px shrink-0 border-b-2 px-1 py-2 text-sm whitespace-nowrap',
                            isSelected
                                ? 'border-sky-500 font-bold text-slate-900'
                                : 'border-transparent text-slate-500',
                        )}
                    >
                        {tab.name}
                    </button>
                )
            })}
        </div>
    )
}
