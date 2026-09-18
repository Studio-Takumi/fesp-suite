'use client'

import { useEffect } from 'react'

import { zodResolver } from '@hookform/resolvers/zod'
import { useQuery } from '@tanstack/react-query'
import { Controller, useForm } from 'react-hook-form'

import { type BlogListProps, blogListPropsSchema } from '@fesp/schema'

import { blogTagsQuery } from '~/lib/queries'

import { IdListCheckboxes } from './fields/IdListCheckboxes'
import { SwitchField } from './fields/SwitchField'

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
            <Controller
                control={control}
                name='showTagTabs'
                render={({ field }) => (
                    <SwitchField
                        id='blog-list-show-tag-tabs'
                        label='タグタブを出す'
                        checked={field.value}
                        onCheckedChange={field.onChange}
                    />
                )}
            />
            <Controller
                control={control}
                name='tags'
                render={({ field }) => (
                    <IdListCheckboxes
                        legend='タブに出すタグ'
                        options={tags.data ?? []}
                        value={field.value}
                        onChange={field.onChange}
                        idPrefix='blog-list-tag'
                        disabled={!showTagTabs}
                    />
                )}
            />
        </div>
    )
}
