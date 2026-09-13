'use client'

import type { ComponentProps } from '@blocknote/react'
import { components as shadcnComponents } from '@blocknote/shadcn'

import { cn } from '~/lib/utils'

/**
 * スラッシュメニューの外枠。BlockNote標準（`@blocknote/shadcn`）は高さの上限が無く、
 * ブロック種別を足すほど際限なく伸びる。Notionにならい、一定の高さでスクロールさせる。
 */
export function SlashMenuRoot(props: ComponentProps['SuggestionMenu']['Root']) {
    const DefaultRoot = shadcnComponents.SuggestionMenu.Root

    return <DefaultRoot {...props} className={cn('max-h-80', props.className)} />
}
