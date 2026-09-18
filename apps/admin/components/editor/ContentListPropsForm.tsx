'use client'

import { useEffect } from 'react'

import { zodResolver } from '@hookform/resolvers/zod'
import { Controller, useFieldArray, useForm } from 'react-hook-form'

import {
    type ContentListIcon,
    contentListIcons,
    type ContentListLinks,
    contentListLinksSchema,
    type ContentListProps,
    formatContentListLinks,
    parseContentListLinks,
} from '@fesp/schema'

import { Button } from '~/components/ui/button'
import { Input } from '~/components/ui/input'
import { Label } from '~/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '~/components/ui/select'

export type ContentListPropsFormProps = {
    defaultValues: ContentListProps
    /** 入力が props の条件に合うときだけ呼ぶ */
    onValidChange: (props: ContentListProps) => void
}

/** アイコン（lucide の名前）→ セレクトに出す名前 */
const contentListIconLabels: Record<ContentListIcon, string> = {
    'calendar-days': 'カレンダー',
    map: '地図',
    store: '店',
    music: '音符',
    newspaper: '新聞',
    'cloud-sun': '雲と太陽',
    'clipboard-list': 'クリップボード',
}

/** リンクを足したときの初期値 */
const emptyLink = { label: '', icon: contentListIcons[0], href: '' }

/**
 * その他のコンテンツ（`contentList`）の props のフォーム。入力するたびに検証し、合っていればブロックに反映する。
 * props の `links`（1行1件の文字列）はフォームではリンクの配列として扱い、反映するときに文字列に戻す
 */
export function ContentListPropsForm({ defaultValues, onValidChange }: ContentListPropsFormProps) {
    const {
        control,
        register,
        watch,
        formState: { errors },
    } = useForm<ContentListLinks>({
        resolver: zodResolver(contentListLinksSchema),
        mode: 'onChange',
        defaultValues: { links: parseContentListLinks(defaultValues.links) },
    })
    const { fields, append, remove } = useFieldArray({ control, name: 'links' })

    useEffect(() => {
        const subscription = watch((values) => {
            const result = contentListLinksSchema.safeParse(values)
            if (result.success) onValidChange({ links: formatContentListLinks(result.data.links) })
        })
        return () => subscription.unsubscribe()
    }, [watch, onValidChange])

    return (
        <div className='space-y-4'>
            {fields.map((field, index) => (
                <fieldset key={field.id} className='space-y-2 rounded-md border border-border p-3'>
                    <legend className='px-1 text-sm font-medium'>{index + 1}件目</legend>
                    <div className='space-y-2'>
                        <Label htmlFor={`content-list-label-${index}`}>表示名</Label>
                        <Input
                            id={`content-list-label-${index}`}
                            aria-invalid={errors.links?.[index]?.label ? true : undefined}
                            {...register(`links.${index}.label`)}
                        />
                        {errors.links?.[index]?.label && (
                            <p role='alert' className='text-sm text-destructive'>
                                {errors.links[index].label.message}
                            </p>
                        )}
                    </div>
                    <div className='space-y-2'>
                        <Label htmlFor={`content-list-icon-${index}`}>アイコン</Label>
                        <Controller
                            control={control}
                            name={`links.${index}.icon`}
                            render={({ field: iconField }) => (
                                <Select value={iconField.value} onValueChange={iconField.onChange}>
                                    <SelectTrigger id={`content-list-icon-${index}`}>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {contentListIcons.map((icon) => (
                                            <SelectItem key={icon} value={icon}>
                                                {contentListIconLabels[icon]}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            )}
                        />
                    </div>
                    <div className='space-y-2'>
                        <Label htmlFor={`content-list-href-${index}`}>リンク先</Label>
                        <Input
                            id={`content-list-href-${index}`}
                            placeholder='/schedule'
                            aria-invalid={errors.links?.[index]?.href ? true : undefined}
                            {...register(`links.${index}.href`)}
                        />
                        {errors.links?.[index]?.href && (
                            <p role='alert' className='text-sm text-destructive'>
                                {errors.links[index].href.message}
                            </p>
                        )}
                    </div>
                    <Button type='button' variant='outline' size='sm' onClick={() => remove(index)}>
                        削除
                    </Button>
                </fieldset>
            ))}
            <Button type='button' variant='outline' size='sm' onClick={() => append(emptyLink)}>
                リンクを追加
            </Button>
        </div>
    )
}
