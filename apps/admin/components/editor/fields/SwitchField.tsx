'use client'

import { Label } from '~/components/ui/label'
import { Switch } from '~/components/ui/switch'

export type SwitchFieldProps = {
    id: string
    label: string
    checked: boolean
    onCheckedChange: (checked: boolean) => void
    onBlur?: () => void
}

/** 一覧のブロックの「〜を出す」のスイッチ。ラベルを左、スイッチを右に置く */
export function SwitchField({ id, label, checked, onCheckedChange, onBlur }: SwitchFieldProps) {
    return (
        <div className='flex items-center justify-between gap-2'>
            <Label htmlFor={id}>{label}</Label>
            <Switch id={id} checked={checked} onCheckedChange={onCheckedChange} onBlur={onBlur} />
        </div>
    )
}
