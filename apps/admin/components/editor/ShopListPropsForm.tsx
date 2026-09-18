'use client'

import { useEffect } from 'react'

import { zodResolver } from '@hookform/resolvers/zod'
import { useQuery } from '@tanstack/react-query'
import { Controller, useForm } from 'react-hook-form'

import { type ShopListProps, shopListPropsSchema } from '@fesp/schema'

import { shopTagsQuery } from '~/lib/queries'

import { IdListCheckboxes } from './fields/IdListCheckboxes'
import { SwitchField } from './fields/SwitchField'

export type ShopListPropsFormProps = {
    defaultValues: ShopListProps
    /** 入力が props の条件に合うときだけ呼ぶ */
    onValidChange: (props: ShopListProps) => void
}

/** タグのチェックボックスより上に並べるスイッチ（「カードに商品を出す」はタグの下に置くので含めない） */
const switches: { name: 'showDateTabs' | 'showSearch' | 'showSort' | 'showTagTabs'; label: string }[] = [
    { name: 'showDateTabs', label: '日付タブを出す' },
    { name: 'showSearch', label: '検索を出す' },
    { name: 'showSort', label: '並び替えを出す' },
    { name: 'showTagTabs', label: 'タグタブを出す' },
]

/**
 * 模擬店一覧（`shopList`）の props のフォーム。切り替えるたびに検証し、合っていればブロックに反映する。
 * タブに出すタグは、タグの一覧（仮データ）からチェックボックスで選ぶ
 */
export function ShopListPropsForm({ defaultValues, onValidChange }: ShopListPropsFormProps) {
    const tags = useQuery(shopTagsQuery())
    const { control, watch } = useForm<ShopListProps>({
        resolver: zodResolver(shopListPropsSchema),
        mode: 'onChange',
        defaultValues,
    })

    useEffect(() => {
        const subscription = watch((values) => {
            const result = shopListPropsSchema.safeParse(values)
            if (result.success) onValidChange(result.data)
        })
        return () => subscription.unsubscribe()
    }, [watch, onValidChange])

    const showTagTabs = watch('showTagTabs')

    return (
        <div className='space-y-4'>
            {switches.map(({ name, label }) => (
                <Controller
                    key={name}
                    control={control}
                    name={name}
                    render={({ field }) => (
                        <SwitchField
                            id={`shop-list-${name}`}
                            label={label}
                            checked={field.value}
                            onCheckedChange={field.onChange}
                            onBlur={field.onBlur}
                        />
                    )}
                />
            ))}
            <Controller
                control={control}
                name='tags'
                render={({ field }) => (
                    <IdListCheckboxes
                        legend='タブに出すタグ'
                        options={tags.data ?? []}
                        value={field.value}
                        onChange={field.onChange}
                        idPrefix='shop-list-tag'
                        disabled={!showTagTabs}
                    />
                )}
            />
            <Controller
                control={control}
                name='showProducts'
                render={({ field }) => (
                    <SwitchField
                        id='shop-list-show-products'
                        label='カードに商品を出す'
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        onBlur={field.onBlur}
                    />
                )}
            />
        </div>
    )
}
