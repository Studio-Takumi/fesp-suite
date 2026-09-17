'use client'

import { useEffect } from 'react'

import { zodResolver } from '@hookform/resolvers/zod'
import { Controller, useForm } from 'react-hook-form'

import { type ScheduleTableProps, scheduleTablePropsSchema } from '@fesp/schema'

import { Label } from '~/components/ui/label'
import { Switch } from '~/components/ui/switch'

export type ScheduleTablePropsFormProps = {
    defaultValues: ScheduleTableProps
    /** 入力が props の条件に合うときだけ呼ぶ */
    onValidChange: (props: ScheduleTableProps) => void
}

/** スケジュール表（`scheduleTable`）の props のフォーム。切り替えるたびに検証し、合っていればブロックに反映する */
export function ScheduleTablePropsForm({ defaultValues, onValidChange }: ScheduleTablePropsFormProps) {
    const { control, watch } = useForm<ScheduleTableProps>({
        resolver: zodResolver(scheduleTablePropsSchema),
        mode: 'onChange',
        defaultValues,
    })

    useEffect(() => {
        const subscription = watch((values) => {
            const result = scheduleTablePropsSchema.safeParse(values)
            if (result.success) onValidChange(result.data)
        })
        return () => subscription.unsubscribe()
    }, [watch, onValidChange])

    return (
        <div className='flex items-center justify-between gap-4'>
            <Label htmlFor='schedule-table-show-date-tabs'>日付タブを出す</Label>
            <Controller
                control={control}
                name='showDateTabs'
                render={({ field }) => (
                    <Switch
                        id='schedule-table-show-date-tabs'
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        onBlur={field.onBlur}
                        ref={field.ref}
                    />
                )}
            />
        </div>
    )
}
