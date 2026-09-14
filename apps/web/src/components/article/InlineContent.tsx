import { Fragment, type ReactNode } from 'react'

import type { ArticleBlock, ArticleStyledText } from '@fesp/schema'

import { getAllowedLinkProtocol } from './link-protocol'

type InlineContentProps = {
    content: ArticleBlock['content']
}

/** テキスト系ブロックの中身（装飾つきの文字・リンク）。文字色・背景色は反映しない */
export function InlineContent({ content }: InlineContentProps) {
    if (!Array.isArray(content)) return null

    return (
        <>
            {content.map((item, index) => {
                if (item.type === 'text') return <Fragment key={index}>{renderStyledText(item)}</Fragment>

                const label = item.content.map((text, textIndex) => (
                    <Fragment key={textIndex}>{renderStyledText(text)}</Fragment>
                ))
                const protocol = getAllowedLinkProtocol(item.href)
                if (!protocol) return <Fragment key={index}>{label}</Fragment>

                const opensInNewTab = protocol === 'http:' || protocol === 'https:'
                return (
                    <a
                        key={index}
                        href={item.href}
                        className='underline underline-offset-2'
                        {...(opensInNewTab ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
                    >
                        {label}
                    </a>
                )
            })}
        </>
    )
}

function renderStyledText({ text, styles }: ArticleStyledText): ReactNode {
    let node: ReactNode = text
    if (styles.code) node = <code className='rounded bg-muted px-1 font-mono text-sm'>{node}</code>
    if (styles.bold) node = <strong>{node}</strong>
    if (styles.italic) node = <em>{node}</em>
    if (styles.underline) node = <u>{node}</u>
    if (styles.strike) node = <s>{node}</s>
    return node
}
