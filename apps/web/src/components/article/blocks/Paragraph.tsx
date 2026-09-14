import type { BlockComponentProps } from '../block-registry'
import { InlineContent } from '../InlineContent'

/** 段落。中身が空でも空行として高さを持たせる */
export function Paragraph({ block, children }: BlockComponentProps) {
    return (
        <>
            <p className='min-h-7'>
                <InlineContent content={block.content} />
            </p>
            {children}
        </>
    )
}
