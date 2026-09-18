import { useState } from 'react'

import { mainHeroPropsSchema, parseMainHeroSlides } from '@fesp/schema'
import { cn } from '@fesp/ui'

import type { BlockComponentProps } from '../block-registry'

/**
 * メインスライダー（独自コンポーネント `mainHero`）。画像の上にキャッチ・タイトル・ドットを重ねる。
 * ドットを押すとスライドを切り替える（自動では切り替えない）。スライドが1枚も無ければ何も出さない
 */
export function MainHero({ block, children }: BlockComponentProps) {
    // 記事は取得時に検証済みだが、型は `Record<string, unknown>` なのでここで props の型にする
    const props = mainHeroPropsSchema.safeParse(block.props)
    const [selectedIndex, setSelectedIndex] = useState(0)

    const slides = props.success ? parseMainHeroSlides(props.data.slides) : []
    // props が変わってスライドが減ったときのために、選んでいる位置を残っている範囲に収める
    const current = slides[selectedIndex] ?? slides[0]

    return (
        <>
            {current && (
                <section aria-label='メインスライダー' className='relative -mx-4 h-56 overflow-hidden bg-slate-100'>
                    <img src={current.imageUrl} alt='' className='size-full object-cover' />
                    {/* 画像の下側を暗くして、白い文字を読めるようにする */}
                    <div className='absolute inset-x-0 bottom-0 flex flex-col gap-2 bg-gradient-to-t from-slate-900/55 to-transparent p-5 pt-24'>
                        {current.catchphrase && (
                            <p className='text-xs font-medium tracking-wider text-white/80'>{current.catchphrase}</p>
                        )}
                        {current.title && <p className='text-2xl leading-snug font-bold text-white'>{current.title}</p>}
                        {slides.length > 1 && (
                            <div className='flex items-center gap-2 pt-1'>
                                {slides.map((slide, index) => {
                                    const isSelected = slide === current
                                    return (
                                        <button
                                            key={`${index}-${slide.imageUrl}`}
                                            type='button'
                                            aria-label={`${index + 1}枚目`}
                                            aria-current={isSelected}
                                            onClick={() => setSelectedIndex(index)}
                                            className={cn(
                                                'h-2 rounded-full',
                                                isSelected ? 'w-5 bg-white' : 'w-2 bg-white/40',
                                            )}
                                        />
                                    )
                                })}
                            </div>
                        )}
                    </div>
                </section>
            )}
            {children}
        </>
    )
}
