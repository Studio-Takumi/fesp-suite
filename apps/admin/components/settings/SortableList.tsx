'use client'

import type { ReactNode } from 'react'

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
import { GripVertical } from 'lucide-react'

import { cn } from '~/lib/utils'

export type SortableListProps<Item extends { id: string }> = {
    items: Item[]
    /** 並べ替えが確定したときに、並べ替え後の全部を渡す */
    onReorder: (items: Item[]) => void
    children: (item: Item) => ReactNode
    'aria-label': string
}

/**
 * つまみをドラッグして行を入れ替えられる縦のリスト。場所・タグの一覧で使う。
 * 並べ替えを確定した時点で `onReorder` を呼ぶので、呼び出し側が `sort_order` を振り直して保存する
 */
export function SortableList<Item extends { id: string }>({
    items,
    onReorder,
    children,
    'aria-label': ariaLabel,
}: SortableListProps<Item>) {
    // ポインタは8px動かしてからドラッグにする（行の中のボタンを押せなくなるのを防ぐ）
    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
        useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
    )

    const handleDragEnd = ({ active, over }: DragEndEvent) => {
        if (!over || active.id === over.id) return

        const from = items.findIndex((item) => item.id === active.id)
        const to = items.findIndex((item) => item.id === over.id)
        if (from === -1 || to === -1) return

        onReorder(arrayMove(items, from, to))
    }

    return (
        <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            modifiers={[restrictToVerticalAxis, restrictToParentElement]}
            onDragEnd={handleDragEnd}
        >
            <SortableContext items={items} strategy={verticalListSortingStrategy}>
                <ul aria-label={ariaLabel} className='flex flex-col gap-2'>
                    {items.map((item) => (
                        <SortableRow key={item.id} id={item.id}>
                            {children(item)}
                        </SortableRow>
                    ))}
                </ul>
            </SortableContext>
        </DndContext>
    )
}

function SortableRow({ id, children }: { id: string; children: ReactNode }) {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id })

    return (
        <li
            ref={setNodeRef}
            style={{ transform: CSS.Transform.toString(transform), transition }}
            className={cn(
                'flex items-center gap-2 rounded-lg border border-border bg-white p-2',
                isDragging && 'relative z-10 shadow-md',
            )}
        >
            <button
                type='button'
                aria-label='並べ替え'
                className='cursor-grab text-slate-400 hover:text-slate-700'
                {...attributes}
                {...listeners}
            >
                <GripVertical size={16} />
            </button>
            {children}
        </li>
    )
}
