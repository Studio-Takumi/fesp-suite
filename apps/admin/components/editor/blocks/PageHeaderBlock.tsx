'use client'

import { createReactBlockSpec, useEditorState } from '@blocknote/react'
import { PanelTop } from 'lucide-react'

import { ComponentBlockCard } from './ComponentBlockCard'

/**
 * ページ見出し（`pageHeader`）。デザインの PageHeader（英語ラベル＋日本語タイトル）。
 * 中身を持たない独自コンポーネントのブロックで、props はサイドパネル（ComponentPropsPanel）で編集する。
 * エディタ上ではカード（ComponentBlockCard）の中に、ウェブアプリに寄せた見た目で出す。厳密には一致させない（docs/article-system.md 参照）
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
        render: function PageHeaderBlock({ block, editor }) {
            const isSelected = useEditorState({
                editor,
                selector: ({ editor }) => editor.getTextCursorPosition().block.id === block.id,
            })
            const { label, title } = block.props

            return (
                <ComponentBlockCard
                    icon={<PanelTop className='size-3.5' />}
                    name='ページ見出し'
                    isSelected={isSelected}
                >
                    {!label && !title ? (
                        <div className='flex flex-col gap-1.5' data-testid='page-header-skeleton'>
                            <div className='h-2 w-12 rounded-full bg-slate-200' />
                            <div className='h-5 w-40 rounded-md bg-slate-200' />
                            <div className='text-xs text-slate-400'>右のパネルで入力してください</div>
                        </div>
                    ) : (
                        <div className='flex flex-col gap-1'>
                            {label && (
                                <div className='text-[11px] font-bold tracking-[0.18em] text-sky-500 uppercase'>
                                    {label}
                                </div>
                            )}
                            {title && <div className='text-[28px] leading-tight font-bold text-slate-900'>{title}</div>}
                        </div>
                    )}
                </ComponentBlockCard>
            )
        },
    },
)
