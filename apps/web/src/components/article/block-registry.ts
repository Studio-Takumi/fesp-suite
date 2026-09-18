import type { ComponentType, ReactNode } from 'react'

import type { ArticleBlock } from '@fesp/schema'

import { AdjacentPosts } from './blocks/AdjacentPosts'
import { BlogList } from './blocks/BlogList'
import { Callout } from './blocks/Callout'
import { CheckListItem } from './blocks/CheckListItem'
import { CodeBlock } from './blocks/CodeBlock'
import { CoverImage } from './blocks/CoverImage'
import { Divider } from './blocks/Divider'
import { Heading } from './blocks/Heading'
import { ListItem } from './blocks/ListItem'
import { Map } from './blocks/Map'
import { NewsList } from './blocks/NewsList'
import { PageHeader } from './blocks/PageHeader'
import { Paragraph } from './blocks/Paragraph'
import { PostSummary } from './blocks/PostSummary'
import { Quote } from './blocks/Quote'
import { RelatedPosts } from './blocks/RelatedPosts'
import { ScheduleTable } from './blocks/ScheduleTable'
import { Table } from './blocks/Table'
import { TodayWeather } from './blocks/TodayWeather'
import { ToggleListItem } from './blocks/ToggleListItem'
import { Wbgt } from './blocks/Wbgt'
import { WeatherAlert } from './blocks/WeatherAlert'
import { WeatherCredit } from './blocks/WeatherCredit'
import { WeatherOverview } from './blocks/WeatherOverview'
import { WeeklyForecast } from './blocks/WeeklyForecast'

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
    callout: Callout,
    divider: Divider,
    table: Table,
    codeBlock: CodeBlock,
    pageHeader: PageHeader,
    scheduleTable: ScheduleTable,
    map: Map,
    newsList: NewsList,
    coverImage: CoverImage,
    postSummary: PostSummary,
    adjacentPosts: AdjacentPosts,
    blogList: BlogList,
    relatedPosts: RelatedPosts,
    todayWeather: TodayWeather,
    weeklyForecast: WeeklyForecast,
    weatherAlert: WeatherAlert,
    wbgt: Wbgt,
    weatherOverview: WeatherOverview,
    weatherCredit: WeatherCredit,
}
