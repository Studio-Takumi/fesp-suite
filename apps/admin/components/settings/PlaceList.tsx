'use client'

import { useState } from 'react'

import { useQuery } from '@tanstack/react-query'
import { Trash2 } from 'lucide-react'

import type { Place } from '@fesp/schema'

import { Button } from '~/components/ui/button'
import { Input } from '~/components/ui/input'
import { placeQueries } from '~/lib/queries'

import { SettingsSection } from './SettingsSection'
import { SortableList } from './SortableList'

/** 入力欄から離れたときに、値が変わっていれば保存する。変わっていなければ何もしない */
function changedValue(next: string, previous: string | null): string | null | undefined {
    const trimmed = next.trim()
    const value = trimmed === '' ? null : trimmed
    return value === previous ? undefined : value
}

export function PlaceList() {
    const places = useQuery(placeQueries.list())
    const createPlace = placeQueries.useCreate()
    const updatePlace = placeQueries.useUpdate()
    const deletePlace = placeQueries.useDelete()

    const [newName, setNewName] = useState('')
    const [newBuilding, setNewBuilding] = useState('')
    const [newFloor, setNewFloor] = useState('')

    const items = places.data?.items ?? []
    const error = places.error ?? createPlace.error ?? updatePlace.error ?? deletePlace.error

    const handleAdd = () => {
        const name = newName.trim()
        if (name === '') return

        createPlace.mutate(
            {
                name,
                building: newBuilding.trim() || null,
                floor: newFloor.trim() || null,
                // いまの最大 + 1。1件も無ければ 0（docs/admin.md）
                sort_order: items.length === 0 ? 0 : Math.max(...items.map((item) => item.sort_order)) + 1,
            },
            {
                onSuccess: () => {
                    setNewName('')
                    setNewBuilding('')
                    setNewFloor('')
                },
            },
        )
    }

    /** 上から順に 0 から振り直し、値が変わる行だけ保存する */
    const handleReorder = (reordered: Place[]) => {
        reordered.forEach((place, index) => {
            if (place.sort_order === index) return
            updatePlace.mutate({ ...place, sort_order: index })
        })
    }

    const handleBlur = (place: Place, field: 'name' | 'building' | 'floor', next: string) => {
        if (field === 'name') {
            const name = next.trim()
            // 名前は空にできない。空のまま離れたら元の値に戻す（入力欄は defaultValue なので再描画で戻る）
            if (name === '' || name === place.name) return
            updatePlace.mutate({ ...place, name })
            return
        }

        const value = changedValue(next, place[field])
        if (value === undefined) return
        updatePlace.mutate({ ...place, [field]: value })
    }

    return (
        <SettingsSection title='場所' description='模擬店・出演者が参照する会場・教室の一覧' error={error}>
            {places.isPending ? (
                <p className='text-sm text-muted-foreground'>読み込み中…</p>
            ) : items.length === 0 ? (
                <p className='text-sm text-muted-foreground'>場所がありません</p>
            ) : (
                <SortableList items={items} onReorder={handleReorder} aria-label='場所の一覧'>
                    {(place) => (
                        <>
                            <Input
                                key={`name-${place.id}-${place.name}`}
                                defaultValue={place.name}
                                aria-label='場所名'
                                onBlur={(event) => handleBlur(place, 'name', event.target.value)}
                                className='flex-1'
                            />
                            <Input
                                key={`building-${place.id}-${place.building}`}
                                defaultValue={place.building ?? ''}
                                aria-label='建物'
                                placeholder='建物'
                                onBlur={(event) => handleBlur(place, 'building', event.target.value)}
                                className='w-40'
                            />
                            <Input
                                key={`floor-${place.id}-${place.floor}`}
                                defaultValue={place.floor ?? ''}
                                aria-label='階'
                                placeholder='階'
                                onBlur={(event) => handleBlur(place, 'floor', event.target.value)}
                                className='w-24'
                            />
                            <Button
                                variant='ghost'
                                size='icon'
                                aria-label={`${place.name}を削除`}
                                onClick={() => deletePlace.mutate(place.id)}
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
                    aria-label='追加する場所名'
                    placeholder='場所名'
                    className='flex-1'
                />
                <Input
                    value={newBuilding}
                    onChange={(event) => setNewBuilding(event.target.value)}
                    aria-label='追加する建物'
                    placeholder='建物'
                    className='w-40'
                />
                <Input
                    value={newFloor}
                    onChange={(event) => setNewFloor(event.target.value)}
                    aria-label='追加する階'
                    placeholder='階'
                    className='w-24'
                />
                <Button onClick={handleAdd} disabled={newName.trim() === '' || createPlace.isPending}>
                    追加
                </Button>
            </div>
        </SettingsSection>
    )
}
