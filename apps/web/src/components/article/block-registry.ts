import type { ComponentType, ReactNode } from 'react'

import type { ArticleBlock } from '@fesp/schema'

import { AdjacentPosts } from './blocks/AdjacentPosts'
import { ArtistActions } from './blocks/ArtistActions'
import { ArtistList } from './blocks/ArtistList'
import { ArtistSummary } from './blocks/ArtistSummary'
import { BlogList } from './blocks/BlogList'
import { Callout } from './blocks/Callout'
import { CheckListItem } from './blocks/CheckListItem'
import { CodeBlock } from './blocks/CodeBlock'
import { ContentList } from './blocks/ContentList'
import { CoverImage } from './blocks/CoverImage'
import { Divider } from './blocks/Divider'
import { Heading } from './blocks/Heading'
import { ListItem } from './blocks/ListItem'
import { MainHero } from './blocks/MainHero'
import { Map } from './blocks/Map'
import { NewsList } from './blocks/NewsList'
import { PageHeader } from './blocks/PageHeader'
import { Paragraph } from './blocks/Paragraph'
import { PostSummary } from './blocks/PostSummary'
import { ProductList } from './blocks/ProductList'
import { Quote } from './blocks/Quote'
import { RelatedPosts } from './blocks/RelatedPosts'
import { ScheduleTable } from './blocks/ScheduleTable'
import { SetList } from './blocks/SetList'
import { ShopActions } from './blocks/ShopActions'
import { ShopList } from './blocks/ShopList'
import { ShopSummary } from './blocks/ShopSummary'
import { Table } from './blocks/Table'
import { TodayWeather } from './blocks/TodayWeather'
import { ToggleListItem } from './blocks/ToggleListItem'
import { Wbgt } from './blocks/Wbgt'
import { WeatherAlert } from './blocks/WeatherAlert'
import { WeatherBar } from './blocks/WeatherBar'
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
 * 管理者サイトのブロック定義も同時に足すこと（docs/article-system.md 参照）。
 *
 * 独自コンポーネントの並びは、管理者サイトのスラッシュメニュー（`ArticleEditor.tsx` の
 * `componentSlashMenuItems`）に揃える。メニューのグループの切れ目は空行で表す
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

    pageHeader: PageHeader, // ページ見出し

    mainHero: MainHero, // メインスライダー
    weatherBar: WeatherBar, // 日付・天気の帯
    contentList: ContentList, // その他のコンテンツ

    newsList: NewsList, // お知らせ一覧
    coverImage: CoverImage, // 記事の画像
    postSummary: PostSummary, // 記事のサマリー
    adjacentPosts: AdjacentPosts, // 前後の記事

    blogList: BlogList, // ブログ一覧
    relatedPosts: RelatedPosts, // 関連する記事

    scheduleTable: ScheduleTable, // スケジュール表

    map: Map, // マップ

    todayWeather: TodayWeather, // 今日の天気
    weeklyForecast: WeeklyForecast, // 週間予報
    weatherAlert: WeatherAlert, // 気象警報・注意報
    wbgt: Wbgt, // 暑さ指数
    weatherOverview: WeatherOverview, // 天気概況
    weatherCredit: WeatherCredit, // 天気の更新時刻・出典

    shopList: ShopList, // 模擬店一覧
    shopSummary: ShopSummary, // 模擬店のサマリー
    productList: ProductList, // 商品一覧
    shopActions: ShopActions, // 模擬店のアクション

    artistList: ArtistList, // 出演者一覧
    artistSummary: ArtistSummary, // 出演者のサマリー
    setList: SetList, // セットリスト
    artistActions: ArtistActions, // 出演者のアクション
}
