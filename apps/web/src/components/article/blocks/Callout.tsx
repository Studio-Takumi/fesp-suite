import type { ComponentType } from 'react'

import { Info, type LucideProps, OctagonAlert, TriangleAlert } from 'lucide-react'

import type { CalloutVariant } from '@fesp/schema'

import type { BlockComponentProps } from '../block-registry'
import { InlineContent } from '../InlineContent'

/** 種類ごとの見出し・アイコン・色。Tailwind が拾えるようにクラスは省略せずに書く */
const variants: Record<
    CalloutVariant,
    { label: string; Icon: ComponentType<LucideProps>; frame: string; icon: string; text: string }
> = {
    info: {
        label: '情報',
        Icon: Info,
        frame: 'border-emerald-300 bg-emerald-50',
        icon: 'text-emerald-700',
        text: 'text-emerald-800 marker:text-emerald-700',
    },
    caution: {
        label: '注意',
        Icon: TriangleAlert,
        frame: 'border-amber-300 bg-amber-50',
        icon: 'text-amber-700',
        text: 'text-amber-800 marker:text-amber-700',
    },
    warning: {
        label: '警告',
        Icon: OctagonAlert,
        frame: 'border-red-300 bg-red-50',
        icon: 'text-red-700',
        text: 'text-red-800 marker:text-red-700',
    },
}

/**
 * 注意書き（`callout`）。デザインの「注意事項」。見出しは種類（`variant`）の表示名で固定し、
 * 本文と子ブロックを同じ枠の中に出す（子ブロックは ArticleRenderer が1段下げずに渡す）
 */
export function Callout({ block, children }: BlockComponentProps) {
    // 描画前に articleDocumentSchema で検証済みなので、variant は3種類のどれか
    const { label, Icon, frame, icon, text } = variants[block.props.variant as CalloutVariant]
    const hasContent = Array.isArray(block.content) && block.content.length > 0

    return (
        <div role='note' aria-label={label} className={`flex flex-col gap-2 rounded-xl border px-4 py-3 ${frame}`}>
            <div className='flex items-center gap-2'>
                <Icon size={15} aria-hidden className={icon} />
                <span className={`text-sm font-bold ${text}`}>{label}</span>
            </div>
            {hasContent && (
                <p className={`text-sm leading-6 ${text}`}>
                    <InlineContent content={block.content} />
                </p>
            )}
            {children && <div className={`text-sm leading-6 ${text}`}>{children}</div>}
        </div>
    )
}
