import type { ReactNode } from 'react'

import type { ArticleBlock, ArticleDocument } from '@fesp/schema'

import { type BlockRegistry, blockRegistry } from './block-registry'

/** 続いている項目を1つのリストにまとめるブロック */
const lists: Partial<Record<ArticleBlock['type'], { tag: 'ul' | 'ol'; className: string }>> = {
    bulletListItem: { tag: 'ul', className: 'list-disc space-y-1 pl-6' },
    numberedListItem: { tag: 'ol', className: 'list-decimal space-y-1 pl-6' },
    checkListItem: { tag: 'ul', className: 'space-y-1' },
}

/** 子ブロックを1段下げずに、ブロックの中にそのまま並べるブロック（注意書きは枠の中に子ブロックを出す） */
const unindentedChildren: ReadonlySet<ArticleBlock['type']> = new Set(['callout'])

type ArticleRendererProps = {
    blocks: ArticleDocument
    /** ブロックの `type` → 描画するコンポーネント。テストで差し替えるとき以外は既定のまま使う */
    registry?: BlockRegistry
}

/**
 * 記事本文（BlockNoteのブロック配列）を上から辿って描画する。
 * 検証（知らないブロックを取り除く）は取得時に `articleViewResponseSchema` で済ませてある前提。
 * それでもレジストリに無い `type` に当たったら、そのブロックだけ飛ばして描画を続ける
 */
export function ArticleRenderer({ blocks, registry = blockRegistry }: ArticleRendererProps) {
    return <div className='space-y-4 leading-7'>{renderBlocks(blocks, registry)}</div>
}

function renderBlocks(blocks: ArticleBlock[], registry: BlockRegistry): ReactNode[] {
    const groups: ArticleBlock[][] = []
    for (const block of blocks) {
        const last = groups.at(-1)
        if (lists[block.type] && last?.[0]?.type === block.type) last.push(block)
        else groups.push([block])
    }

    return groups.map((group) => {
        const [first] = group
        if (!first || !registry[first.type]) return null

        const list = lists[first.type]
        if (!list) return renderBlock(first, registry)

        const items = group.map((block) => renderBlock(block, registry))
        if (list.tag === 'ol') {
            const start = typeof first.props.start === 'number' ? first.props.start : undefined
            return (
                <ol key={first.id} start={start} className={list.className}>
                    {items}
                </ol>
            )
        }
        return (
            <ul key={first.id} className={list.className}>
                {items}
            </ul>
        )
    })
}

function renderBlock(block: ArticleBlock, registry: BlockRegistry): ReactNode {
    const Component = registry[block.type]
    if (!Component) return null

    return (
        <Component key={block.id} block={block}>
            {block.children.length > 0 ? (
                <div className={unindentedChildren.has(block.type) ? 'space-y-2' : 'mt-2 space-y-2 pl-6'}>
                    {renderBlocks(block.children, registry)}
                </div>
            ) : null}
        </Component>
    )
}
