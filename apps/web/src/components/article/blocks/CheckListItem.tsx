import type { BlockComponentProps } from '../block-registry'
import { InlineContent } from '../InlineContent'

/** チェックリストの項目。来場者は操作できない */
export function CheckListItem({ block, children }: BlockComponentProps) {
    return (
        <li>
            <label className='flex items-start gap-2'>
                <input type='checkbox' className='mt-2' checked={block.props.checked === true} disabled readOnly />
                <span>
                    <InlineContent content={block.content} />
                </span>
            </label>
            {children}
        </li>
    )
}
