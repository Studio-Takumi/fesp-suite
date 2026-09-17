import { type PointerEvent, type ReactNode, useRef, useState } from 'react'

import { cn } from '@fesp/ui'

/**
 * たたんだ状態で見せる高さ（ハンドル `h-6` + カテゴリのタブ `h-22`）。
 * 描画する前は大きさを測れないので、たたんだ位置はこの値で決める
 */
const PEEK_HEIGHT = '7rem'

/** 動かした距離がこれ以下なら、ドラッグではなくタップとして扱う（px） */
const TAP_THRESHOLD = 4

type Drag = {
    pointerId: number
    startY: number
    /** たたんだ状態のときにシートを下げる距離（px） */
    closedOffset: number
    startOffset: number
    offset: number
    moved: boolean
}

type MapBottomSheetProps = {
    /** ハンドルの下、常に見える部分（カテゴリのタブ） */
    header: ReactNode
    /** 開いたときに見える部分（場所の一覧）。長いときはこの中だけスクロールする */
    children: ReactNode
}

/**
 * 引き上げ式のボトムシート。開いた状態（高さは親の半分）とたたんだ状態（ハンドルと `header` だけ見える）の2段で止まる。
 * ハンドルのドラッグ（pointer events）で指に合わせて動かし、離したときに近いほうの段に止める。ハンドルのタップでも切り替える
 */
export function MapBottomSheet({ header, children }: MapBottomSheetProps) {
    const [isOpen, setIsOpen] = useState(false)
    const [drag, setDrag] = useState<Drag | null>(null)
    const sheetRef = useRef<HTMLDivElement>(null)
    const peekRef = useRef<HTMLDivElement>(null)
    // ドラッグで離したあとに続けて来る click で、もう一度切り替えないようにする
    const ignoreClickRef = useRef(false)

    const handlePointerDown = (event: PointerEvent<HTMLButtonElement>) => {
        const sheetHeight = sheetRef.current?.getBoundingClientRect().height ?? 0
        const peekHeight = peekRef.current?.getBoundingClientRect().height ?? 0
        const closedOffset = Math.max(sheetHeight - peekHeight, 0)
        const startOffset = isOpen ? 0 : closedOffset

        event.currentTarget.setPointerCapture?.(event.pointerId)
        ignoreClickRef.current = false
        setDrag({
            pointerId: event.pointerId,
            startY: event.clientY,
            closedOffset,
            startOffset,
            offset: startOffset,
            moved: false,
        })
    }

    const handlePointerMove = (event: PointerEvent<HTMLButtonElement>) => {
        if (!drag || drag.pointerId !== event.pointerId) return

        const deltaY = event.clientY - drag.startY
        setDrag({
            ...drag,
            offset: Math.min(Math.max(drag.startOffset + deltaY, 0), drag.closedOffset),
            moved: drag.moved || Math.abs(deltaY) > TAP_THRESHOLD,
        })
    }

    const handlePointerEnd = (event: PointerEvent<HTMLButtonElement>) => {
        if (!drag || drag.pointerId !== event.pointerId) return

        if (drag.moved) {
            setIsOpen(drag.offset < drag.closedOffset / 2)
            ignoreClickRef.current = true
        }
        setDrag(null)
    }

    const handleClick = () => {
        if (ignoreClickRef.current) {
            ignoreClickRef.current = false
            return
        }
        setIsOpen((open) => !open)
    }

    const isDragging = drag?.moved ?? false
    const transform = isDragging
        ? `translateY(${drag!.offset}px)`
        : isOpen
          ? 'translateY(0)'
          : `translateY(calc(100% - ${PEEK_HEIGHT}))`

    return (
        <div
            ref={sheetRef}
            role='region'
            aria-label='ボトムシート'
            data-state={isOpen ? 'open' : 'closed'}
            style={{ transform }}
            className={cn(
                'absolute inset-x-0 bottom-0 flex h-1/2 flex-col rounded-t-2xl border-t border-slate-200 bg-white shadow-lg',
                !isDragging && 'transition-transform duration-300',
            )}
        >
            <div ref={peekRef} className='shrink-0'>
                <button
                    type='button'
                    aria-label={isOpen ? '場所の一覧をたたむ' : '場所の一覧を開く'}
                    aria-expanded={isOpen}
                    onPointerDown={handlePointerDown}
                    onPointerMove={handlePointerMove}
                    onPointerUp={handlePointerEnd}
                    onPointerCancel={handlePointerEnd}
                    onClick={handleClick}
                    className='flex h-6 w-full cursor-grab touch-none items-center justify-center'
                >
                    <span className='h-1 w-10 rounded-full bg-slate-300' />
                </button>
                {header}
            </div>
            <div className='min-h-0 flex-1 overflow-y-auto px-4 pb-4'>{children}</div>
        </div>
    )
}
