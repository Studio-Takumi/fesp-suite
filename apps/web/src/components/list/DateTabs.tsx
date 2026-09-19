import { cn, dateFormatter } from '@fesp/ui'

import { ALL_TAB } from './ListTagTabs'

export type DateTab = {
    /** 開催日の順番（1日目なら `1`） */
    day: number
    /** その日の日付（ISO文字列） */
    date: string
}

export type DateTabsProps = {
    days: DateTab[]
    /** 選んでいる日。「すべて」なら `all`、日を選んでいればその順番の文字列 */
    selected: string
    onSelect: (value: string) => void
    /** 先頭に「すべて」を出すか */
    showAll: boolean
    /** タブの並べ方。`start` は左寄せで横スクロール、`center` は中央寄せ */
    align?: 'start' | 'center'
}

/** 日付のタブ。選んでいるタブは水色の塗りに白い文字。一覧（先頭に「すべて」）とスケジュール表で使う */
export function DateTabs({ days, selected, onSelect, showAll, align = 'start' }: DateTabsProps) {
    return (
        <div
            role='tablist'
            aria-label='日付'
            className={cn('flex gap-2', align === 'center' ? 'justify-center' : 'overflow-x-auto')}
        >
            {showAll && (
                <button
                    type='button'
                    role='tab'
                    aria-selected={selected === ALL_TAB}
                    onClick={() => onSelect(ALL_TAB)}
                    className={cn(
                        'flex h-8 shrink-0 items-center rounded-full px-4 text-base font-semibold',
                        selected === ALL_TAB ? 'bg-sky-500 text-white' : 'bg-slate-100 text-slate-900',
                    )}
                >
                    すべて
                </button>
            )}
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
                            'flex h-8 shrink-0 items-center rounded-full px-4',
                            isSelected ? 'bg-sky-500' : 'bg-slate-100',
                        )}
                    >
                        <span
                            className={cn(
                                'font-en pr-2 text-base font-bold',
                                isSelected ? 'text-white' : 'text-slate-900',
                            )}
                        >
                            Day{day}
                        </span>
                        <span
                            className={cn('font-en text-sm font-bold', isSelected ? 'text-white/80' : 'text-slate-400')}
                        >
                            {dateFormatter(date, 'M/D')}
                        </span>
                        <span className={cn('text-[8px]', isSelected ? 'text-white/80' : 'text-slate-400')}>
                            {dateFormatter(date, '(EEE)')}
                        </span>
                    </button>
                )
            })}
        </div>
    )
}
