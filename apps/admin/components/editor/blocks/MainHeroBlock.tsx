'use client'

import { createReactBlockSpec, useEditorState } from '@blocknote/react'
import { Images } from 'lucide-react'

import { type MainHeroProps, parseMainHeroSlides } from '@fesp/schema'

import { ComponentBlockCard } from './ComponentBlockCard'

/** カードに出す設定の要約（1要素1行）。スライドが1枚も無ければ空 */
export function summarizeMainHeroProps(props: MainHeroProps): string[] {
    const slides = parseMainHeroSlides(props.slides)
    if (slides.length === 0) return []

    return [
        `スライド: ${slides.length}枚`,
        ...slides.map((slide, index) => `${index + 1}. ${slide.title || '（タイトルなし）'}`),
    ]
}

/**
 * メインスライダー（`mainHero`）。中身を持たない独自コンポーネントのブロックで、props はサイドパネル（ComponentPropsPanel）で編集する。
 * エディタ上ではカードに設定の要約（枚数とタイトル）だけを出す（画像のプレビューはしない）
 */
export const createMainHeroBlock = createReactBlockSpec(
    {
        type: 'mainHero',
        propSchema: {
            /** スライドの並び。1行が1枚で `画像の URL|キャッチ|タイトル` */
            slides: { default: '' },
        },
        content: 'none',
    },
    {
        render: function MainHeroBlock({ block, editor }) {
            const isSelected = useEditorState({
                editor,
                selector: ({ editor }) => editor.getTextCursorPosition().block.id === block.id,
            })
            const summary = summarizeMainHeroProps(block.props)

            return (
                <ComponentBlockCard icon={<Images size={14} />} name='メインスライダー' isSelected={isSelected}>
                    {summary.length > 0 ? (
                        <div className='flex flex-col gap-1 text-sm text-slate-700'>
                            {summary.map((line) => (
                                <div key={line}>{line}</div>
                            ))}
                        </div>
                    ) : (
                        <div className='text-sm text-slate-400'>
                            スライドが設定されていません（ウェブアプリには何も出ません）
                        </div>
                    )}
                </ComponentBlockCard>
            )
        },
    },
)
