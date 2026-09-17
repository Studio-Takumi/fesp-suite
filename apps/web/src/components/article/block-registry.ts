import type { ComponentType, ReactNode } from 'react'

import type { ArticleBlock } from '@fesp/schema'

import { AdjacentPosts } from './blocks/AdjacentPosts'
import { CheckListItem } from './blocks/CheckListItem'
import { CodeBlock } from './blocks/CodeBlock'
import { CoverImage } from './blocks/CoverImage'
import { Divider } from './blocks/Divider'
import { Heading } from './blocks/Heading'
import { ListItem } from './blocks/ListItem'
import { NewsList } from './blocks/NewsList'
import { PageHeader } from './blocks/PageHeader'
import { Paragraph } from './blocks/Paragraph'
import { PostSummary } from './blocks/PostSummary'
import { Quote } from './blocks/Quote'
import { Table } from './blocks/Table'
import { ToggleListItem } from './blocks/ToggleListItem'

export type BlockComponentProps = {
    block: ArticleBlock
    /** 子ブロック（`children`）を描画したもの。ブロックの中身の下に置く */
    children?: ReactNode
}

export type BlockRegistry = Partial<Record<ArticleBlock['type'], ComponentType<BlockComponentProps>>>

/**
 * ブロックの `type` → 描画するコンポーネント。ここに無い `type` は描画しない。
 * 独自コンポーネント（`pageHeader` など）もここに足す。足すときは `packages/schema` の記事ドキュメントと
 * 管理者サイトのブロック定義も同時に足すこと（docs/article-system.md 参照）
 */
export const blockRegistry: BlockRegistry = {
    paragraph: Paragraph,
    heading: Heading,
    bulletListItem: ListItem,
    numberedListItem: ListItem,
    checkListItem: CheckListItem,
    toggleListItem: ToggleListItem,
    quote: Quote,
    divider: Divider,
    table: Table,
    codeBlock: CodeBlock,
    pageHeader: PageHeader,
    newsList: NewsList,
    coverImage: CoverImage,
    postSummary: PostSummary,
    adjacentPosts: AdjacentPosts,
}
