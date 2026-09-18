'use client'

import { useEffect } from 'react'

import { zodResolver } from '@hookform/resolvers/zod'
import { useQuery } from '@tanstack/react-query'
import { Controller, useForm } from 'react-hook-form'

import { type BlogListProps, blogListPropsSchema, parseBlogListTags } from '@fesp/schema'

import { Checkbox } from '~/components/ui/checkbox'
import { Label } from '~/components/ui/label'
import { Switch } from '~/components/ui/switch'
import { blogTagsQuery } from '~/lib/queries'

export type BlogListPropsFormProps = {
    defaultValues: BlogListProps
    /** 入力が props の条件に合うときだけ呼ぶ */
    onValidChange: (props: BlogListProps) => void
}

/**
 * ブログ一覧（`blogList`）の props のフォーム。入力するたびに検証し、合っていればブロックに反映する。
 * タブに出すタグは、タグの一覧（仮データ）からチェックボックスで選ぶ
 */
export function BlogListPropsForm({ defaultValues, onValidChange }: BlogListPropsFormProps) {
    const tags = useQuery(blogTagsQuery())
    const { control, watch } = useForm<BlogListProps>({
        resolver: zodResolver(blogListPropsSchema),
        mode: 'onChange',
        defaultValues,
    })

    useEffect(() => {
        const subscription = watch((values) => {
            const result = blogListPropsSchema.safeParse(values)
            if (result.success) onValidChange(result.data)
        })
        return () => subscription.unsubscribe()
    }, [watch, onValidChange])

    const showTagTabs = watch('showTagTabs')

    return (
        <div className='space-y-4'>
            <div className='flex items-center justify-between gap-2'>
                <Label htmlFor='blog-list-show-tag-tabs'>タグタブを出す</Label>
                <Controller
                    control={control}
                    name='showTagTabs'
                    render={({ field }) => (
                        <Switch id='blog-list-show-tag-tabs' checked={field.value} onCheckedChange={field.onChange} />
                    )}
                />
            </div>
            <fieldset className='space-y-2'>
                <legend className='text-sm font-medium'>タブに出すタグ</legend>
                <Controller
                    control={control}
                    name='tags'
                    render={({ field }) => {
                        const selected = parseBlogListTags(field.value)
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
                                            id={`blog-list-tag-${tag.id}`}
                                            checked={selected.includes(tag.id)}
                                            disabled={!showTagTabs}
                                            onCheckedChange={(checked) => toggle(tag.id, checked === true)}
                                        />
                                        <Label htmlFor={`blog-list-tag-${tag.id}`} className='font-normal'>
                                            {tag.name}
                                        </Label>
                                    </div>
                                ))}
                            </div>
                        )
                    }}
                />
            </fieldset>
        </div>
    )
}
