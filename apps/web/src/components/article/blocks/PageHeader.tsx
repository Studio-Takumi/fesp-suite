import type { BlockComponentProps } from '../block-registry'

/**
 * ページ見出し（独自コンポーネント `pageHeader`）。英語ラベルと日本語タイトル。
 * ページタイトルが `h1` なので、日本語タイトルは `h2` にする。両方とも空なら何も出さない
 */
export function PageHeader({ block, children }: BlockComponentProps) {
    const label = typeof block.props.label === 'string' ? block.props.label : ''
    const title = typeof block.props.title === 'string' ? block.props.title : ''

    return (
        <>
            {(label || title) && (
                <header className='flex flex-col gap-0.75'>
                    {label && (
                        <p className='font-en text-[11px] leading-[1.4] font-bold tracking-[2px] text-sky-500 uppercase'>
                            {label}
                        </p>
                    )}
                    {title && <h2 className='font-jp text-[28px] leading-[1.3] font-bold text-slate-900'>{title}</h2>}
                </header>
            )}
            {children}
        </>
    )
}
