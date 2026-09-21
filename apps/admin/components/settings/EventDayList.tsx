'use client'

import { useState } from 'react'

import { useQuery } from '@tanstack/react-query'
import { Trash2 } from 'lucide-react'

import type { EventDay } from '@fesp/schema'

import { Button } from '~/components/ui/button'
import { Input } from '~/components/ui/input'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '~/components/ui/table'
import { eventDayQueries } from '~/lib/queries'

import { SettingsSection } from './SettingsSection'

export function EventDayList() {
    const eventDays = useQuery(eventDayQueries.list())
    const createEventDay = eventDayQueries.useCreate()
    const updateEventDay = eventDayQueries.useUpdate()
    const deleteEventDay = eventDayQueries.useDelete()

    const [newDate, setNewDate] = useState('')
    const [newName, setNewName] = useState('')

    const items = eventDays.data?.items ?? []
    const error = eventDays.error ?? createEventDay.error ?? updateEventDay.error ?? deleteEventDay.error

    const handleAdd = () => {
        if (newDate === '') return

        createEventDay.mutate(
            {
                // day はいまの最大 + 1。1件も無ければ 1（docs/admin.md）
                day: items.length === 0 ? 1 : Math.max(...items.map((item) => item.day)) + 1,
                date: newDate,
                name: newName.trim() || null,
            },
            {
                onSuccess: () => {
                    setNewDate('')
                    setNewName('')
                },
            },
        )
    }

    const handleDateBlur = (eventDay: EventDay, next: string) => {
        // 日付は空にできない。空のまま離れたら元の値に戻す
        if (next === '' || next === eventDay.date) return
        updateEventDay.mutate({ ...eventDay, date: next })
    }

    const handleNameBlur = (eventDay: EventDay, next: string) => {
        const name = next.trim() || null
        if (name === eventDay.name) return
        updateEventDay.mutate({ ...eventDay, name })
    }

    /**
     * 消したあと、後ろの行の `day` を1つずつ前へ詰める。
     * `day` はイベントごとに1から続く決まりなので、穴が開いたままにしない（docs/db.md）
     */
    const handleDelete = (eventDay: EventDay) => {
        deleteEventDay.mutate(eventDay.id, {
            onSuccess: () => {
                for (const item of items) {
                    if (item.day > eventDay.day) updateEventDay.mutate({ ...item, day: item.day - 1 })
                }
            },
        })
    }

    return (
        <SettingsSection
            title='開催日'
            description='模擬店・出演者・スケジュールが参照する開催日。日付は日本時間'
            error={error}
        >
            {eventDays.isPending ? (
                <p className='text-sm text-muted-foreground'>読み込み中…</p>
            ) : items.length === 0 ? (
                <p className='text-sm text-muted-foreground'>開催日がありません</p>
            ) : (
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className='w-24'>何日目</TableHead>
                            <TableHead className='w-48'>日付</TableHead>
                            <TableHead>表示名</TableHead>
                            <TableHead className='w-16' />
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {items.map((eventDay) => (
                            <TableRow key={eventDay.id}>
                                <TableCell>{eventDay.day}日目</TableCell>
                                <TableCell>
                                    <Input
                                        key={`date-${eventDay.id}-${eventDay.date}`}
                                        type='date'
                                        defaultValue={eventDay.date}
                                        aria-label={`${eventDay.day}日目の日付`}
                                        onBlur={(event) => handleDateBlur(eventDay, event.target.value)}
                                    />
                                </TableCell>
                                <TableCell>
                                    <Input
                                        key={`name-${eventDay.id}-${eventDay.name}`}
                                        defaultValue={eventDay.name ?? ''}
                                        placeholder={`${eventDay.day}日目`}
                                        aria-label={`${eventDay.day}日目の表示名`}
                                        onBlur={(event) => handleNameBlur(eventDay, event.target.value)}
                                    />
                                </TableCell>
                                <TableCell>
                                    <Button
                                        variant='ghost'
                                        size='icon'
                                        aria-label={`${eventDay.day}日目を削除`}
                                        onClick={() => handleDelete(eventDay)}
                                    >
                                        <Trash2 size={16} />
                                    </Button>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            )}

            <div className='flex items-center gap-2'>
                <Input
                    type='date'
                    value={newDate}
                    onChange={(event) => setNewDate(event.target.value)}
                    aria-label='追加する日付'
                    className='w-48'
                />
                <Input
                    value={newName}
                    onChange={(event) => setNewName(event.target.value)}
                    aria-label='追加する表示名'
                    placeholder='表示名（前夜祭 など。空でよい）'
                    className='flex-1'
                />
                <Button onClick={handleAdd} disabled={newDate === '' || createEventDay.isPending}>
                    追加
                </Button>
            </div>
        </SettingsSection>
    )
}
