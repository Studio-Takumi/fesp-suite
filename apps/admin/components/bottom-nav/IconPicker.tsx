'use client'

import { useMemo, useState } from 'react'

import { DynamicIcon, type IconName, iconNames } from 'lucide-react/dynamic'

import { Button } from '~/components/ui/button'
import { Input } from '~/components/ui/input'
import { Popover, PopoverContent, PopoverTrigger } from '~/components/ui/popover'

/** 一度に出す候補の数。lucide のアイコンは1000を超えるので、検索で絞って上から並べる */
const MAX_RESULTS = 60

/** ケバブケース（`calendar-days`）を、DB に持つ PascalCase（`CalendarDays`）にする */
export function kebabToIconName(kebab: string): string {
    return kebab
        .split('-')
        .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
        .join('')
}

/** PascalCase（`CalendarDays`）を、`DynamicIcon` が受け取るケバブケース（`calendar-days`）にする */
export function iconNameToKebab(name: string): string {
    return name
        .replace(/([A-Z]+)([A-Z][a-z])/g, '$1-$2')
        .replace(/([a-z0-9])([A-Z])/g, '$1-$2')
        .toLowerCase()
}

export type IconPickerProps = {
    /** いま選んでいるアイコン名（PascalCase）。未選択なら空文字 */
    value: string
    onChange: (name: string) => void
    'aria-label': string
}

/**
 * lucide のアイコンを検索して選ぶ。取りうる値を絞っていないので、名前で絞り込んで上から出す。
 * 値は DB に合わせて PascalCase で出し入れする
 */
export function IconPicker({ value, onChange, 'aria-label': ariaLabel }: IconPickerProps) {
    const [isOpen, setIsOpen] = useState(false)
    const [query, setQuery] = useState('')

    const results = useMemo(() => {
        const keyword = query.trim().toLowerCase()
        const matched = keyword === '' ? iconNames : iconNames.filter((name) => name.includes(keyword))
        return matched.slice(0, MAX_RESULTS)
    }, [query])

    return (
        <Popover open={isOpen} onOpenChange={setIsOpen}>
            <PopoverTrigger asChild>
                <Button variant='outline' aria-label={ariaLabel} className='w-36 justify-start gap-2'>
                    {value ? (
                        <DynamicIcon name={iconNameToKebab(value) as IconName} size={16} fallback={() => null} />
                    ) : null}
                    <span className='truncate text-xs'>{value || 'アイコンを選ぶ'}</span>
                </Button>
            </PopoverTrigger>
            <PopoverContent className='w-72 space-y-2'>
                <Input
                    value={query}
                    onChange={(event) => setQuery(event.target.value)}
                    aria-label='アイコンを検索'
                    placeholder='アイコンを検索（英語）'
                />
                <ul className='grid max-h-64 grid-cols-6 gap-1 overflow-y-auto'>
                    {results.map((name) => (
                        <li key={name}>
                            <button
                                type='button'
                                aria-label={kebabToIconName(name)}
                                onClick={() => {
                                    onChange(kebabToIconName(name))
                                    setIsOpen(false)
                                }}
                                className='flex size-10 items-center justify-center rounded-lg text-slate-700 hover:bg-slate-100'
                            >
                                <DynamicIcon name={name} size={18} fallback={() => null} />
                            </button>
                        </li>
                    ))}
                </ul>
                {results.length === 0 ? <p className='text-sm text-muted-foreground'>見つかりませんでした</p> : null}
            </PopoverContent>
        </Popover>
    )
}
