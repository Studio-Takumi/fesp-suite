import type { BlockComponentProps } from '../block-registry'
import { InlineContent } from '../InlineContent'

const headingClassNames = {
    h2: 'text-xl font-bold',
    h3: 'text-lg font-bold',
    h4: 'text-base font-bold',
    h5: 'text-base font-bold',
    h6: 'text-base font-bold',
}

/** 見出し。ページタイトルが `h1` なので1段下げる（レベル1→`h2` … レベル5以上→`h6`） */
export function Heading({ block, children }: BlockComponentProps) {
    const level = typeof block.props.level === 'number' ? block.props.level : 1
    const Tag = `h${Math.min(level + 1, 6)}` as keyof typeof headingClassNames

    return (
        <>
            <Tag className={headingClassNames[Tag]}>
                <InlineContent content={block.content} />
            </Tag>
            {children}
        </>
    )
}
