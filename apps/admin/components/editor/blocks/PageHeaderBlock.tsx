'use client'

import { createReactBlockSpec } from '@blocknote/react'

/**
 * ページ見出し（`pageHeader`）。デザインの PageHeader（英語ラベル＋日本語タイトル）。
 * 中身を持たない独自コンポーネントのブロックで、props はサイドパネル（ComponentPropsPanel）で編集する。
 * エディタ上の見た目はウェブアプリに寄せるが、厳密には一致させない（docs/article-system.md 参照）
 */
export const createPageHeaderBlock = createReactBlockSpec(
    {
        type: 'pageHeader',
        propSchema: {
            label: { default: '' },
            title: { default: '' },
        },
        content: 'none',
    },
    {
        render: ({ block }) => {
            const { label, title } = block.props

            if (!label && !title) {
                return (
                    <div className='w-full py-1 text-muted-foreground' contentEditable={false}>
                        ページ見出し（右のパネルで入力）
                    </div>
                )
            }

            return (
                <div className='flex w-full flex-col gap-1 py-1' contentEditable={false}>
                    {label && <p className='text-xs font-bold tracking-[0.18em] text-sky-500 uppercase'>{label}</p>}
                    {title && <p className='text-[28px] leading-tight font-bold text-slate-900'>{title}</p>}
                </div>
            )
        },
    },
)
