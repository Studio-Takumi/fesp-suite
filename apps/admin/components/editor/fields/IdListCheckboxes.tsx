'use client'

import { parseIdListProp } from '@fesp/schema'

import { Checkbox } from '~/components/ui/checkbox'
import { Label } from '~/components/ui/label'

export type IdListCheckboxesProps = {
    /** 見出し（例: `タブに出すタグ`） */
    legend: string
    /** 選べるもの。並びはこの順にそろえる */
    options: { id: string; name: string }[]
    /** 選んでいる ID をカンマ区切りで並べた文字列 */
    value: string
    onChange: (value: string) => void
    /** 入力欄の `id` の頭に付ける文字（例: `news-list-tag`） */
    idPrefix: string
    disabled?: boolean
}

/**
 * ID をカンマ区切りで持つ props（タブに出すタグ・表示する商品）を、チェックボックスで選ぶ入力欄。
 * 選んだ ID は、選べるものの並び順にそろえて返す
 */
export function IdListCheckboxes({ legend, options, value, onChange, idPrefix, disabled }: IdListCheckboxesProps) {
    const selected = parseIdListProp(value)
    const toggle = (id: string, checked: boolean) =>
        onChange(
            options
                .map((option) => option.id)
                .filter((optionId) => (optionId === id ? checked : selected.includes(optionId)))
                .join(','),
        )

    return (
        <fieldset className='space-y-2'>
            <legend className='text-sm font-medium'>{legend}</legend>
            <div className='space-y-2'>
                {options.map((option) => (
                    <div key={option.id} className='flex items-center gap-2'>
                        <Checkbox
                            id={`${idPrefix}-${option.id}`}
                            checked={selected.includes(option.id)}
                            disabled={disabled}
                            onCheckedChange={(checked) => toggle(option.id, checked === true)}
                        />
                        <Label htmlFor={`${idPrefix}-${option.id}`} className='font-normal'>
                            {option.name}
                        </Label>
                    </div>
                ))}
            </div>
        </fieldset>
    )
}
