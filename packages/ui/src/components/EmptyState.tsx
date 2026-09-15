import type { ReactNode } from 'react'

import type { LucideIcon } from 'lucide-react'
import { Inbox } from 'lucide-react'

import { cn } from '../lib/cn'

export type EmptyStateProps = {
    title: string
    description?: string
    icon?: LucideIcon
    action?: ReactNode
    className?: string
}

/** データが0件のときの共通表示 */
export function EmptyState({ title, description, icon: Icon = Inbox, action, className }: EmptyStateProps) {
    return (
        <div
            className={cn(
                'flex flex-col items-center justify-center gap-3 rounded-lg border border-dashed border-border px-6 py-12 text-center',
                className,
            )}
        >
            <Icon aria-hidden className='size-8 text-muted-foreground' />
            <div className='space-y-1'>
                <p className='font-medium'>{title}</p>
                {description ? <p className='text-sm text-muted-foreground'>{description}</p> : null}
            </div>
            {action}
        </div>
    )
}
