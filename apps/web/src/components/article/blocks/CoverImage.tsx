import type { BlockComponentProps } from '../block-registry'

/**
 * 記事の画像（独自コンポーネント `coverImage`）。画面の幅いっぱい・16:9 で出す。URL が空なら何も出さない。
 * デザインは画面の端まで画像を出すので、本文エリアの左右の余白（AppShell の `px-4`）を打ち消す
 */
export function CoverImage({ block, children }: BlockComponentProps) {
    const imageUrl = typeof block.props.imageUrl === 'string' ? block.props.imageUrl : ''

    return (
        <>
            {imageUrl && (
                <div className='-mx-4 aspect-video overflow-hidden bg-slate-100'>
                    <img src={imageUrl} alt='' className='size-full object-cover' />
                </div>
            )}
            {children}
        </>
    )
}
