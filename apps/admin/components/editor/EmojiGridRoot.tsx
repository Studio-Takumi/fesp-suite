'use client'

import type { ComponentProps } from '@blocknote/react'
import { components as shadcnComponents } from '@blocknote/shadcn'

import { cn } from '~/lib/utils'

/**
 * 絵文字ピッカー（`:` で開くグリッド）の外枠。BlockNote標準（`@blocknote/shadcn`）は
 * こちらも高さの上限が無く、未絞り込み時は数百件のグリッドがそのまま伸びてしまう。
 * SlashMenuRootと同様、一定の高さでスクロールさせる。
 */
export function EmojiGridRoot(props: ComponentProps['GridSuggestionMenu']['Root']) {
    const DefaultRoot = shadcnComponents.GridSuggestionMenu.Root

    return <DefaultRoot {...props} className={cn('max-h-80', props.className)} />
}
