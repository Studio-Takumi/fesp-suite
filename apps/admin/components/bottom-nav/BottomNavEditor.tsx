'use client'

import { useEffect, useState } from 'react'

import {
    closestCenter,
    DndContext,
    type DragEndEvent,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
} from '@dnd-kit/core'
import { restrictToParentElement, restrictToVerticalAxis } from '@dnd-kit/modifiers'
import {
    arrayMove,
    SortableContext,
    sortableKeyboardCoordinates,
    useSortable,
    verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { useQuery } from '@tanstack/react-query'
import { GripVertical, Plus, Trash2 } from 'lucide-react'

import { BOTTOM_NAV_MAX_ITEMS, type BottomNavItemInput } from '@fesp/schema'

import { Button } from '~/components/ui/button'
import { Input } from '~/components/ui/input'
import { bottomNavsQuery, useSaveBottomNavs } from '~/lib/queries'
import { cn } from '~/lib/utils'

import { IconPicker } from './IconPicker'

/** 画面の中で編集する1行。並べ替えのために、保存前でも消えない id を持たせる */
type DraftItem = BottomNavItemInput & { key: string }

const emptyItem = (): DraftItem => ({ key: crypto.randomUUID(), label: '', icon: '', href: '' })

/** 入力がそろっていて、移動先が `/` で始まっているか */
function isComplete(item: DraftItem): boolean {
    return item.label.trim() !== '' && item.icon !== '' && item.href.startsWith('/')
}

export function BottomNavEditor() {
    const navs = useQuery(bottomNavsQuery())
    const saveNavs = useSaveBottomNavs()

    const [draft, setDraft] = useState<DraftItem[] | null>(null)

    // 読み込めたら編集用の控えを作る。以降は画面の中だけで編集し、「変更を保存」でまとめて送る
    useEffect(() => {
        if (!navs.data) return
        setDraft(navs.data.items.map(({ label, icon, href }) => ({ key: crypto.randomUUID(), label, icon, href })))
    }, [navs.data])

    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
        useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
    )

    // 読み込めるまでは編集できない（控えが作れないため）。失敗したらその場で止めて理由を出す
    if (!navs.data || !draft) {
        return (
            <div className='space-y-6 p-8'>
                <h1 className='text-2xl font-bold'>下のナビ</h1>
                {navs.error ? (
                    <p role='alert' className='text-sm text-destructive'>
                        {navs.error.message}
                    </p>
                ) : (
                    <p className='text-sm text-muted-foreground'>読み込み中…</p>
                )}
            </div>
        )
    }

    const update = (key: string, patch: Partial<BottomNavItemInput>) =>
        setDraft(draft.map((item) => (item.key === key ? { ...item, ...patch } : item)))

    const handleDragEnd = ({ active, over }: DragEndEvent) => {
        if (!over || active.id === over.id) return

        const from = draft.findIndex((item) => item.key === active.id)
        const to = draft.findIndex((item) => item.key === over.id)
        if (from === -1 || to === -1) return

        setDraft(arrayMove(draft, from, to))
    }

    const saved = navs.data.items
    const isDirty =
        draft.length !== saved.length ||
        draft.some((item, index) => {
            const previous = saved[index]
            return (
                !previous || item.label !== previous.label || item.icon !== previous.icon || item.href !== previous.href
            )
        })
    const canSave = isDirty && draft.every(isComplete) && !saveNavs.isPending

    return (
        <div className='space-y-6 p-8'>
            <div className='flex items-start justify-between'>
                <div>
                    <h1 className='text-2xl font-bold'>下のナビ</h1>
                    <p className='text-sm text-muted-foreground'>
                        ウェブアプリの画面の下に出す導線。上から順に左へ並びます（{BOTTOM_NAV_MAX_ITEMS}件まで）
                    </p>
                </div>
                <Button
                    onClick={() =>
                        saveNavs.mutate(draft.map(({ label, icon, href }) => ({ label: label.trim(), icon, href })))
                    }
                    disabled={!canSave}
                >
                    変更を保存
                </Button>
            </div>

            {saveNavs.error ? (
                <p role='alert' className='text-sm text-destructive'>
                    {saveNavs.error.message}
                </p>
            ) : null}

            {draft.length === 0 ? (
                <p className='text-sm text-muted-foreground'>
                    項目がありません。追加するとウェブアプリの下にナビが出ます
                </p>
            ) : (
                <DndContext
                    sensors={sensors}
                    collisionDetection={closestCenter}
                    modifiers={[restrictToVerticalAxis, restrictToParentElement]}
                    onDragEnd={handleDragEnd}
                >
                    <SortableContext items={draft.map((item) => item.key)} strategy={verticalListSortingStrategy}>
                        <ul aria-label='ナビの項目' className='flex flex-col gap-2'>
                            {draft.map((item, index) => (
                                <SortableRow key={item.key} id={item.key}>
                                    <Input
                                        value={item.label}
                                        onChange={(event) => update(item.key, { label: event.target.value })}
                                        aria-label={`${index + 1}番目の名前`}
                                        placeholder='名前'
                                        className='w-40'
                                    />
                                    <IconPicker
                                        value={item.icon}
                                        onChange={(icon) => update(item.key, { icon })}
                                        aria-label={`${index + 1}番目のアイコン`}
                                    />
                                    <div className='flex-1'>
                                        <Input
                                            value={item.href}
                                            onChange={(event) => update(item.key, { href: event.target.value })}
                                            aria-label={`${index + 1}番目の移動先`}
                                            placeholder='/news'
                                        />
                                        {item.href !== '' && !item.href.startsWith('/') ? (
                                            <p className='mt-1 text-xs text-destructive'>
                                                移動先は / で始まるパスで入力してください
                                            </p>
                                        ) : null}
                                    </div>
                                    <Button
                                        variant='ghost'
                                        size='icon'
                                        aria-label={`${index + 1}番目を削除`}
                                        onClick={() => setDraft(draft.filter((row) => row.key !== item.key))}
                                    >
                                        <Trash2 size={16} />
                                    </Button>
                                </SortableRow>
                            ))}
                        </ul>
                    </SortableContext>
                </DndContext>
            )}

            <Button
                variant='outline'
                onClick={() => setDraft([...draft, emptyItem()])}
                disabled={draft.length >= BOTTOM_NAV_MAX_ITEMS}
            >
                <Plus size={16} />
                項目を追加
            </Button>
        </div>
    )
}

function SortableRow({ id, children }: { id: string; children: React.ReactNode }) {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id })

    return (
        <li
            ref={setNodeRef}
            style={{ transform: CSS.Transform.toString(transform), transition }}
            className={cn(
                'flex items-start gap-2 rounded-lg border border-border bg-white p-2',
                isDragging && 'relative z-10 shadow-md',
            )}
        >
            <button
                type='button'
                aria-label='並べ替え'
                className='mt-2 cursor-grab text-slate-400 hover:text-slate-700'
                {...attributes}
                {...listeners}
            >
                <GripVertical size={16} />
            </button>
            {children}
        </li>
    )
}
