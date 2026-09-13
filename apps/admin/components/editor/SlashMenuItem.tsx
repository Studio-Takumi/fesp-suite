'use client'

import { forwardRef, useEffect, useRef } from 'react'

import type { ComponentProps } from '@blocknote/react'
import { elementOverflow, mergeRefs } from '@blocknote/react'
import { useShadCNComponentsContext } from '@blocknote/shadcn'

import { cn } from '~/lib/utils'

/**
 * スラッシュメニューの1項目。Notionにならい、アイコン・タイトル・ショートカットだけを
 * 常に表示し、説明（`item.subtext`）はホバー時のツールチップで見せる（情報過多を避ける）。
 *
 * BlockNote標準の見た目（`@blocknote/shadcn`）をベースに、説明文の常時表示だけを差し替える。
 */
export const SlashMenuItem = forwardRef<HTMLDivElement, ComponentProps['SuggestionMenu']['Item']>((props, ref) => {
    const ShadCNComponents = useShadCNComponentsContext()!
    const { className, item, isSelected, onClick, id } = props

    const itemRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        if (!itemRef.current || !isSelected) return

        const overflow = elementOverflow(itemRef.current, itemRef.current.closest('.bn-suggestion-menu')!)
        if (overflow !== 'none') {
            itemRef.current.scrollIntoView({ block: 'nearest' })
        }
    }, [isSelected])

    const row = (
        <div
            className={cn(
                'flex cursor-default items-center gap-2 rounded-sm px-2 py-1.5 outline-hidden select-none',
                'hover:bg-accent hover:text-accent-foreground aria-selected:bg-accent aria-selected:text-accent-foreground',
                className,
            )}
            ref={mergeRefs([ref, itemRef])}
            id={id}
            onMouseDown={(event) => event.preventDefault()}
            onClick={onClick}
            role='option'
            aria-selected={isSelected || undefined}
        >
            {item.icon && (
                <div className='text-muted-foreground [&_svg]:size-4' data-position='left'>
                    {item.icon}
                </div>
            )}
            <div className='flex-1 text-sm'>{item.title}</div>
            {item.badge && (
                <div data-position='right' className='text-xs'>
                    <ShadCNComponents.Badge.Badge variant='secondary'>{item.badge}</ShadCNComponents.Badge.Badge>
                </div>
            )}
        </div>
    )

    if (!item.subtext) return row

    return (
        <ShadCNComponents.Tooltip.Tooltip>
            <ShadCNComponents.Tooltip.TooltipTrigger render={row} />
            <ShadCNComponents.Tooltip.TooltipContent side='right'>
                {item.subtext}
            </ShadCNComponents.Tooltip.TooltipContent>
        </ShadCNComponents.Tooltip.Tooltip>
    )
})
SlashMenuItem.displayName = 'SlashMenuItem'
