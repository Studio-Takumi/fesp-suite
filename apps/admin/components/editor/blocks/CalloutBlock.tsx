'use client'

import type { ComponentType } from 'react'

import { createReactBlockSpec, useComponentsContext } from '@blocknote/react'
import { Check, Info, type LucideProps, OctagonAlert, TriangleAlert } from 'lucide-react'

import type { CalloutVariant } from '@fesp/schema'

import { cn } from '~/lib/utils'

/** 注意書きの種類ごとの表示名・アイコン・アイコンの色。枠と文字の色は globals.css で `.bn-block` に付ける */
export const calloutVariants: Record<
    CalloutVariant,
    { label: string; Icon: ComponentType<LucideProps>; icon: string }
> = {
    info: { label: '情報', Icon: Info, icon: 'text-emerald-700' },
    caution: { label: '注意', Icon: TriangleAlert, icon: 'text-amber-700' },
    warning: { label: '警告', Icon: OctagonAlert, icon: 'text-red-700' },
}

const variantKeys = Object.keys(calloutVariants) as CalloutVariant[]

/**
 * 注意書き（`callout`）。デザインの「注意事項」。見出し・引用と同じテキスト系のブロックで、中身の文字を直接編集する。
 * 見出しは種類（`variant`）の表示名で固定し、アイコンを押すと種類を選ぶメニューを開く。
 * 子ブロックはブロックの描画の外（BlockNote の `.bn-block-group`）に入るので、枠は globals.css で
 * ブロック全体（`.bn-block`）に付けて、子ブロックも枠の中に出す。
 * 色は `variant` で決まるので、文字色・背景色・配置の props は持たない（packages/schema の callout と揃える）
 */
export const createCalloutBlock = createReactBlockSpec(
    {
        type: 'callout',
        propSchema: {
            variant: { default: 'caution', values: variantKeys },
        },
        content: 'inline',
    },
    {
        render: function CalloutBlock({ block, editor, contentRef }) {
            const Components = useComponentsContext()!
            const { label, Icon, icon } = calloutVariants[block.props.variant]

            return (
                <div className='flex w-full flex-col gap-1' data-callout-variant={block.props.variant}>
                    <div contentEditable={false} className='flex items-center gap-2 select-none'>
                        <Components.Generic.Menu.Root position='bottom-start'>
                            <Components.Generic.Menu.Trigger>
                                <button
                                    type='button'
                                    aria-label='注意書きの種類'
                                    className={cn('flex rounded-sm p-1 hover:bg-black/5', icon)}
                                >
                                    <Icon size={15} />
                                </button>
                            </Components.Generic.Menu.Trigger>
                            <Components.Generic.Menu.Dropdown className='bn-menu-dropdown'>
                                {variantKeys.map((variant) => {
                                    const { label, Icon, icon } = calloutVariants[variant]
                                    // checked を渡すとチェックボックスの項目になり、選んでもメニューが閉じないので、チェックは自前で出す
                                    return (
                                        <Components.Generic.Menu.Item
                                            key={variant}
                                            icon={<Icon size={15} className={icon} />}
                                            onClick={() => editor.updateBlock(block, { props: { variant } })}
                                        >
                                            {label}
                                            {variant === block.props.variant && <Check size={15} className='ml-auto' />}
                                        </Components.Generic.Menu.Item>
                                    )
                                })}
                            </Components.Generic.Menu.Dropdown>
                        </Components.Generic.Menu.Root>
                        <span className='text-sm font-bold'>{label}</span>
                    </div>
                    <div ref={contentRef} className='leading-6' />
                </div>
            )
        },
    },
)
