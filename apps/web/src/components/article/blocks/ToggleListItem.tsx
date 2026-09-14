import type { BlockComponentProps } from '../block-registry'
import { InlineContent } from '../InlineContent'

/** 開閉できる項目。初期状態は閉じていて、子ブロックは開いた中に出す */
export function ToggleListItem({ block, children }: BlockComponentProps) {
    return (
        <details>
            <summary className='cursor-pointer'>
                <InlineContent content={block.content} />
            </summary>
            {children}
        </details>
    )
}
