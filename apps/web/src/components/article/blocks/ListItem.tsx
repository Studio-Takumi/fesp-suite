import type { BlockComponentProps } from '../block-registry'
import { InlineContent } from '../InlineContent'

/** 箇条書き・番号付きリストの項目。`<ul>` / `<ol>` へのまとめは ArticleRenderer が行う */
export function ListItem({ block, children }: BlockComponentProps) {
    return (
        <li>
            <InlineContent content={block.content} />
            {children}
        </li>
    )
}
