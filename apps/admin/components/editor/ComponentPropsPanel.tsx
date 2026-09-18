'use client'

import type { ReactNode } from 'react'

import type {
    CoverImageProps,
    EmptyComponentProps,
    NewsListProps,
    PageHeaderProps,
    ProductListProps,
    ScheduleTableProps,
    ShopListProps,
    WeatherComponentType,
} from '@fesp/schema'

import { CoverImagePropsForm } from './CoverImagePropsForm'
import { NewsListPropsForm } from './NewsListPropsForm'
import { PageHeaderPropsForm } from './PageHeaderPropsForm'
import { ProductListPropsForm } from './ProductListPropsForm'
import { ScheduleTablePropsForm } from './ScheduleTablePropsForm'
import { ShopListPropsForm } from './ShopListPropsForm'

/** props をサイドパネルで編集する、独自コンポーネントのブロック */
export type ComponentBlock =
    | { id: string; type: 'pageHeader'; props: PageHeaderProps }
    | { id: string; type: 'scheduleTable'; props: ScheduleTableProps }
    | { id: string; type: 'newsList'; props: NewsListProps }
    | { id: string; type: 'coverImage'; props: CoverImageProps }
    | { id: string; type: 'shopList'; props: ShopListProps }
    | { id: string; type: 'productList'; props: ProductListProps }
    | { id: string; type: 'map' | 'postSummary' | 'adjacentPosts' | 'shopSummary'; props: EmptyComponentProps }
    | { id: string; type: WeatherComponentType; props: EmptyComponentProps }

/**
 * 独自コンポーネントのブロックの `type` → パネルに出す名前とフォーム。
 * 設定する props が無いコンポーネントは `renderForm` を持たない（パネルに「設定する項目はありません」と出す）。
 * 独自コンポーネントを足すときは、ここ・`ArticleEditor.tsx` のスキーマとスラッシュメニューに足す
 */
const componentPanels: {
    [Type in ComponentBlock['type']]: {
        name: string
        renderForm?: (
            block: Extract<ComponentBlock, { type: Type }>,
            onChange: (props: Extract<ComponentBlock, { type: Type }>['props']) => void,
        ) => ReactNode
    }
} = {
    pageHeader: {
        name: 'ページ見出し',
        renderForm: (block, onChange) => <PageHeaderPropsForm defaultValues={block.props} onValidChange={onChange} />,
    },
    scheduleTable: {
        name: 'スケジュール表',
        renderForm: (block, onChange) => (
            <ScheduleTablePropsForm defaultValues={block.props} onValidChange={onChange} />
        ),
    },
    newsList: {
        name: 'お知らせ一覧',
        renderForm: (block, onChange) => <NewsListPropsForm defaultValues={block.props} onValidChange={onChange} />,
    },
    coverImage: {
        name: '記事の画像',
        renderForm: (block, onChange) => <CoverImagePropsForm defaultValues={block.props} onValidChange={onChange} />,
    },
    shopList: {
        name: '模擬店一覧',
        renderForm: (block, onChange) => <ShopListPropsForm defaultValues={block.props} onValidChange={onChange} />,
    },
    productList: {
        name: '商品一覧',
        renderForm: (block, onChange) => <ProductListPropsForm defaultValues={block.props} onValidChange={onChange} />,
    },
    map: { name: 'マップ' },
    shopSummary: { name: '模擬店のサマリー' },
    postSummary: { name: '記事のサマリー' },
    adjacentPosts: { name: '前後の記事' },
    todayWeather: { name: '今日の天気' },
    weeklyForecast: { name: '週間予報' },
    weatherAlert: { name: '気象警報・注意報' },
    wbgt: { name: '暑さ指数' },
    weatherOverview: { name: '天気概況' },
    weatherCredit: { name: '天気の更新時刻・出典' },
}

export function isComponentBlock(block: { type: string }): block is ComponentBlock {
    return block.type in componentPanels
}

export type ComponentPropsPanelProps = {
    block: ComponentBlock
    onChange: (props: ComponentBlock['props']) => void
}

/** 選択中の独自コンポーネントのブロックの props を編集するサイドパネル */
export function ComponentPropsPanel({ block, onChange }: ComponentPropsPanelProps) {
    return (
        <aside
            aria-label='コンポーネントの設定'
            className='w-72 shrink-0 space-y-4 rounded-md border border-border p-4'
        >
            <h2 className='text-sm font-semibold'>{componentPanels[block.type].name}</h2>
            {/* ブロックが変わったらフォームを作り直す（入力中の値・エラーを持ち越さない） */}
            <div key={block.id}>{renderPanelForm(block, onChange)}</div>
        </aside>
    )
}

function renderPanelForm(block: ComponentBlock, onChange: (props: ComponentBlock['props']) => void): ReactNode {
    // `type` ごとに対応表を引くと TypeScript が block と renderForm の対応を追えないため、ここで型を合わせる
    const renderForm = componentPanels[block.type].renderForm as
        ((block: ComponentBlock, onChange: (props: ComponentBlock['props']) => void) => ReactNode) | undefined

    return renderForm ? (
        renderForm(block, onChange)
    ) : (
        <p className='text-sm text-muted-foreground'>設定する項目はありません</p>
    )
}
