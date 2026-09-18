'use client'

import { useEffect } from 'react'

import { zodResolver } from '@hookform/resolvers/zod'
import { useQuery } from '@tanstack/react-query'
import { Controller, useForm } from 'react-hook-form'

import { type ArtistListProps, artistListPropsSchema } from '@fesp/schema'

import { artistTagsQuery } from '~/lib/queries'

import { IdListCheckboxes } from './fields/IdListCheckboxes'
import { SwitchField } from './fields/SwitchField'

export type ArtistListPropsFormProps = {
    defaultValues: ArtistListProps
    /** 入力が props の条件に合うときだけ呼ぶ */
    onValidChange: (props: ArtistListProps) => void
}

/** 「日付タブを出す」などのスイッチ。`name` は props のキー */
const SWITCHES: { name: 'showDateTabs' | 'showSearch' | 'showSort' | 'showTagTabs'; label: string }[] = [
    { name: 'showDateTabs', label: '日付タブを出す' },
    { name: 'showSearch', label: '検索を出す' },
    { name: 'showSort', label: '並び替えを出す' },
    { name: 'showTagTabs', label: 'タグタブを出す' },
]

/**
 * 出演者一覧（`artistList`）の props のフォーム。入力するたびに検証し、合っていればブロックに反映する。
 * タブに出すタグは、タグの一覧（仮データ）からチェックボックスで選ぶ
 */
export function ArtistListPropsForm({ defaultValues, onValidChange }: ArtistListPropsFormProps) {
    const tags = useQuery(artistTagsQuery())
    const { control, watch } = useForm<ArtistListProps>({
        resolver: zodResolver(artistListPropsSchema),
        mode: 'onChange',
        defaultValues,
    })

    useEffect(() => {
        const subscription = watch((values) => {
            const result = artistListPropsSchema.safeParse(values)
            if (result.success) onValidChange(result.data)
        })
        return () => subscription.unsubscribe()
    }, [watch, onValidChange])

    const showTagTabs = watch('showTagTabs')

    return (
        <div className='space-y-4'>
            {SWITCHES.map(({ name, label }) => (
                <Controller
                    key={name}
                    control={control}
                    name={name}
                    render={({ field }) => (
                        <SwitchField
                            id={`artist-list-${name}`}
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
                        idPrefix='artist-list-tag'
                        disabled={!showTagTabs}
                    />
                )}
            />
        </div>
    )
}
