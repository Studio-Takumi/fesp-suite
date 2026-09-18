import { cn, dateFormatter } from '@fesp/ui'

import { ALL_TAB } from './ListTagTabs'

export type ListDateTab = {
    /** 開催日の順番（1日目なら `1`） */
    day: number
    /** その日の日付（ISO文字列） */
    date: string
}

export type ListDateTabsProps = {
    days: ListDateTab[]
    /** 選んでいる日。「すべて」なら `all`、日を選んでいればその順番の文字列 */
    selected: string
    onSelect: (value: string) => void
}

/** 一覧の日付のタブ（先頭に「すべて」）。選んでいるタブは水色の塗りに白い文字 */
export function ListDateTabs({ days, selected, onSelect }: ListDateTabsProps) {
    return (
        <div role='tablist' aria-label='日付' className='flex gap-2 overflow-x-auto'>
            <button
                type='button'
                role='tab'
                aria-selected={selected === ALL_TAB}
                onClick={() => onSelect(ALL_TAB)}
                className={cn(
                    'flex h-10 shrink-0 items-center rounded-full px-5 text-sm font-semibold',
                    selected === ALL_TAB ? 'bg-sky-500 text-white' : 'bg-slate-100 text-slate-900',
                )}
            >
                すべて
            </button>
            {days.map(({ day, date }) => {
                const isSelected = selected === String(day)
                return (
                    <button
                        key={day}
                        type='button'
                        role='tab'
                        aria-selected={isSelected}
                        onClick={() => onSelect(String(day))}
                        className={cn(
                            'flex h-10 shrink-0 items-center gap-2 rounded-full px-4',
                            isSelected ? 'bg-sky-500' : 'bg-slate-100',
                        )}
                    >
                        <span
                            className={cn('font-en text-xs font-bold', isSelected ? 'text-white/80' : 'text-slate-400')}
                        >
                            Day{day}
                        </span>
                        <span className={cn('font-en text-lg font-bold', isSelected ? 'text-white' : 'text-slate-900')}>
                            {dateFormatter(date, 'M/D')}
                        </span>
                        <span className={cn('text-xs', isSelected ? 'text-white/80' : 'text-slate-400')}>
                            {dateFormatter(date, '(EEE)')}
                        </span>
                    </button>
                )
            })}
        </div>
    )
}
