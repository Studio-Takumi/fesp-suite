import type { BlockComponentProps } from '../block-registry'

/**
 * ページ見出し（独自コンポーネント `pageHeader`）。英語ラベルと日本語タイトル。
 * 日本語タイトルがページのタイトル（`h1`）になる。両方とも空なら何も出さない
 */
export function PageHeader({ block, children }: BlockComponentProps) {
    const label = typeof block.props.label === 'string' ? block.props.label : ''
    const title = typeof block.props.title === 'string' ? block.props.title : ''

    return (
        <>
            {(label || title) && (
                <header className='flex flex-col gap-1'>
                    {label && (
                        <p className='font-en text-xs font-bold tracking-widest text-sky-500 uppercase'>{label}</p>
                    )}
                    {title && <h1 className='font-jp text-3xl leading-snug font-bold text-slate-900'>{title}</h1>}
                </header>
            )}
            {children}
        </>
    )
}
