'use client'

import { useEffect } from 'react'

import { zodResolver } from '@hookform/resolvers/zod'
import { useQuery } from '@tanstack/react-query'
import { Controller, useForm } from 'react-hook-form'

import { parseShopListTags, type ShopListProps, shopListPropsSchema } from '@fesp/schema'

import { Checkbox } from '~/components/ui/checkbox'
import { Label } from '~/components/ui/label'
import { Switch } from '~/components/ui/switch'
import { shopTagsQuery } from '~/lib/queries'

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
                <div key={name} className='flex items-center justify-between gap-2'>
                    <Label htmlFor={`shop-list-${name}`}>{label}</Label>
                    <Controller
                        control={control}
                        name={name}
                        render={({ field }) => (
                            <Switch
                                id={`shop-list-${name}`}
                                checked={field.value}
                                onCheckedChange={field.onChange}
                                onBlur={field.onBlur}
                                ref={field.ref}
                            />
                        )}
                    />
                </div>
            ))}
            <fieldset className='space-y-2'>
                <legend className='text-sm font-medium'>タブに出すタグ</legend>
                <Controller
                    control={control}
                    name='tags'
                    render={({ field }) => {
                        const selected = parseShopListTags(field.value)
                        // 並びはタグの一覧の順にそろえる
                        const toggle = (id: string, checked: boolean) =>
                            field.onChange(
                                (tags.data ?? [])
                                    .map((tag) => tag.id)
                                    .filter((tagId) => (tagId === id ? checked : selected.includes(tagId)))
                                    .join(','),
                            )

                        return (
                            <div className='space-y-2'>
                                {(tags.data ?? []).map((tag) => (
                                    <div key={tag.id} className='flex items-center gap-2'>
                                        <Checkbox
                                            id={`shop-list-tag-${tag.id}`}
                                            checked={selected.includes(tag.id)}
                                            disabled={!showTagTabs}
                                            onCheckedChange={(checked) => toggle(tag.id, checked === true)}
                                        />
                                        <Label htmlFor={`shop-list-tag-${tag.id}`} className='font-normal'>
                                            {tag.name}
                                        </Label>
                                    </div>
                                ))}
                            </div>
                        )
                    }}
                />
            </fieldset>
            <div className='flex items-center justify-between gap-2'>
                <Label htmlFor='shop-list-show-products'>カードに商品を出す</Label>
                <Controller
                    control={control}
                    name='showProducts'
                    render={({ field }) => (
                        <Switch
                            id='shop-list-show-products'
                            checked={field.value}
                            onCheckedChange={field.onChange}
                            onBlur={field.onBlur}
                            ref={field.ref}
                        />
                    )}
                />
            </div>
        </div>
    )
}
