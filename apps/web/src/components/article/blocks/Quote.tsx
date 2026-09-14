import type { BlockComponentProps } from '../block-registry'
import { InlineContent } from '../InlineContent'

/** 引用 */
export function Quote({ block, children }: BlockComponentProps) {
    return (
        <>
            <blockquote className='border-l-4 border-border pl-4'>
                <InlineContent content={block.content} />
            </blockquote>
            {children}
        </>
    )
}
