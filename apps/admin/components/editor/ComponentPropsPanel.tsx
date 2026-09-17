'use client'

import type { ReactNode } from 'react'

import type { MapProps, PageHeaderProps } from '@fesp/schema'

import { PageHeaderPropsForm } from './PageHeaderPropsForm'

/** props をサイドパネルで編集する、独自コンポーネントのブロック */
export type ComponentBlock =
    { id: string; type: 'pageHeader'; props: PageHeaderProps } | { id: string; type: 'map'; props: MapProps }

/**
 * 独自コンポーネントのブロックの `type` → パネルに出す名前とフォーム。
 * props を持たないコンポーネントは `renderForm` を省き、パネルに「設定する項目はありません」と出す。
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
    map: {
        name: 'マップ',
    },
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
    const panel = componentPanels[block.type]
    // `componentPanels` は `type` ごとに引数の型を絞っているが、`block` は全コンポーネントの union なので広げて呼ぶ
    const renderForm = panel.renderForm as
        ((block: ComponentBlock, onChange: (props: ComponentBlock['props']) => void) => ReactNode) | undefined

    return (
        <aside
            aria-label='コンポーネントの設定'
            className='w-72 shrink-0 space-y-4 rounded-md border border-border p-4'
        >
            <h2 className='text-sm font-semibold'>{panel.name}</h2>
            {renderForm ? (
                // ブロックが変わったらフォームを作り直す（入力中の値・エラーを持ち越さない）
                <div key={block.id}>{renderForm(block, onChange)}</div>
            ) : (
                <p className='text-sm text-muted-foreground'>設定する項目はありません</p>
            )}
        </aside>
    )
}
