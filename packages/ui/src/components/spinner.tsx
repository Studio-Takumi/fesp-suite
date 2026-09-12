import { Loader2 } from 'lucide-react'

import { cn } from '../lib/cn'

export type SpinnerProps = {
    className?: string
    label?: string
}

/** 読み込み中インジケータ。スクリーンリーダー向けのラベル付き */
export function Spinner({ className, label = '読み込み中' }: SpinnerProps) {
    return (
        <span role='status' aria-live='polite' className={cn('inline-flex items-center gap-2', className)}>
            <Loader2 aria-hidden className='size-4 animate-spin' />
            <span className='sr-only'>{label}</span>
        </span>
    )
}
