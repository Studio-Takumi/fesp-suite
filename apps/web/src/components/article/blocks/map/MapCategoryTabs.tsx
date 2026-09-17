import { Flag, Gamepad2, type LucideIcon, Music, UtensilsCrossed } from 'lucide-react'

import { cn } from '@fesp/ui'

import type { MapCategory } from '~/lib/mock/map'

const categories: { id: MapCategory; label: string; icon: LucideIcon }[] = [
    { id: 'home', label: 'ホーム', icon: Flag },
    { id: 'food', label: '食べ物', icon: UtensilsCrossed },
    { id: 'experience', label: '体験', icon: Gamepad2 },
    { id: 'stage', label: 'ステージ', icon: Music },
]

type MapCategoryTabsProps = {
    /** 選んでいるカテゴリ。選んでいなければ `null` */
    selectedCategory: MapCategory | null
    onSelect: (category: MapCategory | null) => void
}

/** カテゴリのタブ。選んでいるタブをもう一度押すと選択を外す */
export function MapCategoryTabs({ selectedCategory, onSelect }: MapCategoryTabsProps) {
    return (
        <div role='group' aria-label='カテゴリ' className='flex h-22 gap-3 px-4 pt-2 pb-3'>
            {categories.map(({ id, label, icon: Icon }) => {
                const isSelected = id === selectedCategory
                return (
                    <button
                        key={id}
                        type='button'
                        aria-pressed={isSelected}
                        onClick={() => onSelect(isSelected ? null : id)}
                        className='flex flex-1 flex-col items-center gap-1'
                    >
                        <span
                            className={cn(
                                'flex size-12 items-center justify-center rounded-full',
                                isSelected ? 'bg-sky-500 text-white' : 'bg-slate-100 text-slate-500',
                            )}
                        >
                            <Icon size={20} aria-hidden />
                        </span>
                        <span className={cn('text-xs', isSelected ? 'text-sky-500' : 'text-slate-500')}>{label}</span>
                    </button>
                )
            })}
        </div>
    )
}
