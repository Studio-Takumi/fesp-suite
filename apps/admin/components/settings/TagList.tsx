'use client'

import { useState } from 'react'

import { useQuery } from '@tanstack/react-query'
import { Trash2 } from 'lucide-react'

import type { Tag } from '@fesp/schema'

import { Button } from '~/components/ui/button'
import { Input } from '~/components/ui/input'
import { tagQueries } from '~/lib/queries'

import { SettingsSection } from './SettingsSection'
import { SortableList } from './SortableList'

export function TagList() {
    const tags = useQuery(tagQueries.list())
    const createTag = tagQueries.useCreate()
    const updateTag = tagQueries.useUpdate()
    const deleteTag = tagQueries.useDelete()

    const [newName, setNewName] = useState('')

    const items = tags.data?.items ?? []
    const error = tags.error ?? createTag.error ?? updateTag.error ?? deleteTag.error

    const handleAdd = () => {
        const name = newName.trim()
        if (name === '') return

        createTag.mutate(
            {
                name,
                sort_order: items.length === 0 ? 0 : Math.max(...items.map((item) => item.sort_order)) + 1,
            },
            { onSuccess: () => setNewName('') },
        )
    }

    /** 上から順に 0 から振り直し、値が変わる行だけ保存する */
    const handleReorder = (reordered: Tag[]) => {
        reordered.forEach((tag, index) => {
            if (tag.sort_order === index) return
            updateTag.mutate({ ...tag, sort_order: index })
        })
    }

    const handleBlur = (tag: Tag, next: string) => {
        const name = next.trim()
        // 名前は空にできない。空のまま離れたら元の値に戻す
        if (name === '' || name === tag.name) return
        updateTag.mutate({ ...tag, name })
    }

    return (
        <SettingsSection
            title='タグ'
            description='お知らせ・ブログ・模擬店・出演者で共通に使うタグ。種類ごとには分かれない'
            error={error}
        >
            {tags.isPending ? (
                <p className='text-sm text-muted-foreground'>読み込み中…</p>
            ) : items.length === 0 ? (
                <p className='text-sm text-muted-foreground'>タグがありません</p>
            ) : (
                <SortableList items={items} onReorder={handleReorder} aria-label='タグの一覧'>
                    {(tag) => (
                        <>
                            <Input
                                key={`name-${tag.id}-${tag.name}`}
                                defaultValue={tag.name}
                                aria-label='タグ名'
                                onBlur={(event) => handleBlur(tag, event.target.value)}
                                className='flex-1'
                            />
                            <Button
                                variant='ghost'
                                size='icon'
                                aria-label={`${tag.name}を削除`}
                                onClick={() => deleteTag.mutate(tag.id)}
                            >
                                <Trash2 size={16} />
                            </Button>
                        </>
                    )}
                </SortableList>
            )}

            <div className='flex items-center gap-2'>
                <Input
                    value={newName}
                    onChange={(event) => setNewName(event.target.value)}
                    aria-label='追加するタグ名'
                    placeholder='タグ名'
                    className='flex-1'
                />
                <Button onClick={handleAdd} disabled={newName.trim() === '' || createTag.isPending}>
                    追加
                </Button>
            </div>
        </SettingsSection>
    )
}
