import type { ComponentType, ReactNode } from 'react'

import type { ArticleBlock } from '@fesp/schema'

import { CheckListItem } from './blocks/CheckListItem'
import { CodeBlock } from './blocks/CodeBlock'
import { Divider } from './blocks/Divider'
import { Heading } from './blocks/Heading'
import { ListItem } from './blocks/ListItem'
import { PageHeader } from './blocks/PageHeader'
import { Paragraph } from './blocks/Paragraph'
import { Quote } from './blocks/Quote'
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
    divider: Divider,
    table: Table,
    codeBlock: CodeBlock,
    pageHeader: PageHeader,
    todayWeather: TodayWeather,
    weeklyForecast: WeeklyForecast,
    weatherAlert: WeatherAlert,
    wbgt: Wbgt,
    weatherOverview: WeatherOverview,
    weatherCredit: WeatherCredit,
}
