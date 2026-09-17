'use client'

import { useEffect } from 'react'

import { zodResolver } from '@hookform/resolvers/zod'
import { useQuery } from '@tanstack/react-query'
import { Controller, useForm } from 'react-hook-form'

import { type NewsListProps, newsListPropsSchema, parseNewsListTags } from '@fesp/schema'

import { Checkbox } from '~/components/ui/checkbox'
import { Input } from '~/components/ui/input'
import { Label } from '~/components/ui/label'
import { Switch } from '~/components/ui/switch'
import { newsTagsQuery } from '~/lib/queries'

export type NewsListPropsFormProps = {
    defaultValues: NewsListProps
    /** 入力が props の条件に合うときだけ呼ぶ */
    onValidChange: (props: NewsListProps) => void
}

/**
 * お知らせ一覧（`newsList`）の props のフォーム。入力するたびに検証し、合っていればブロックに反映する。
 * タブに出すタグは、タグの一覧（仮データ）からチェックボックスで選ぶ
 */
export function NewsListPropsForm({ defaultValues, onValidChange }: NewsListPropsFormProps) {
    const tags = useQuery(newsTagsQuery())
    const {
        control,
        register,
        watch,
        formState: { errors },
    } = useForm<NewsListProps>({
        resolver: zodResolver(newsListPropsSchema),
        mode: 'onChange',
        defaultValues,
    })

    useEffect(() => {
        const subscription = watch((values) => {
            const result = newsListPropsSchema.safeParse(values)
            if (result.success) onValidChange(result.data)
        })
        return () => subscription.unsubscribe()
    }, [watch, onValidChange])

    const showTagTabs = watch('showTagTabs')

    return (
        <div className='space-y-4'>
            <div className='flex items-center justify-between gap-2'>
                <Label htmlFor='news-list-show-tag-tabs'>タグタブを出す</Label>
                <Controller
                    control={control}
                    name='showTagTabs'
                    render={({ field }) => (
                        <Switch id='news-list-show-tag-tabs' checked={field.value} onCheckedChange={field.onChange} />
                    )}
                />
            </div>
            <fieldset className='space-y-2'>
                <legend className='text-sm font-medium'>タブに出すタグ</legend>
                <Controller
                    control={control}
                    name='tags'
                    render={({ field }) => {
                        const selected = parseNewsListTags(field.value)
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
                                            id={`news-list-tag-${tag.id}`}
                                            checked={selected.includes(tag.id)}
                                            disabled={!showTagTabs}
                                            onCheckedChange={(checked) => toggle(tag.id, checked === true)}
                                        />
                                        <Label htmlFor={`news-list-tag-${tag.id}`} className='font-normal'>
                                            {tag.name}
                                        </Label>
                                    </div>
                                ))}
                            </div>
                        )
                    }}
                />
            </fieldset>
            <div className='space-y-2'>
                <Label htmlFor='news-list-limit'>表示件数</Label>
                <Input
                    id='news-list-limit'
                    type='number'
                    min={1}
                    step={1}
                    placeholder='すべて'
                    aria-invalid={errors.limit ? true : undefined}
                    aria-describedby={errors.limit ? 'news-list-limit-error' : undefined}
                    {...register('limit', {
                        // 空なら全件（props から消す）
                        setValueAs: (value: unknown) =>
                            value === '' || value === undefined || value === null ? undefined : Number(value),
                    })}
                />
                {errors.limit && (
                    <p id='news-list-limit-error' role='alert' className='text-sm text-destructive'>
                        {errors.limit.message}
                    </p>
                )}
            </div>
            <div className='flex items-center justify-between gap-2'>
                <Label htmlFor='news-list-show-view-all'>「すべて見る」を出す</Label>
                <Controller
                    control={control}
                    name='showViewAll'
                    render={({ field }) => (
                        <Switch id='news-list-show-view-all' checked={field.value} onCheckedChange={field.onChange} />
                    )}
                />
            </div>
        </div>
    )
}
