'use client'

import type { ReactNode } from 'react'

import type { PageHeaderProps, ScheduleTableProps } from '@fesp/schema'

import { PageHeaderPropsForm } from './PageHeaderPropsForm'
import { ScheduleTablePropsForm } from './ScheduleTablePropsForm'

/** props をサイドパネルで編集する、独自コンポーネントのブロック */
export type ComponentBlock =
    | { id: string; type: 'pageHeader'; props: PageHeaderProps }
    | { id: string; type: 'scheduleTable'; props: ScheduleTableProps }

/**
 * 独自コンポーネントのブロックの `type` → パネルに出す名前とフォーム。
 * 独自コンポーネントを足すときは、ここ・`ArticleEditor.tsx` のスキーマとスラッシュメニューに足す
 */
const componentPanels: {
    [Type in ComponentBlock['type']]: {
        name: string
        renderForm: (
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
    // `type` と props の組み合わせは `componentPanels` の型で保証しているが、TypeScript は union を対応づけて
    // 絞り込めないので、ここだけ型を外す
    const form = panel.renderForm(block as never, onChange)

    return (
        <aside
            aria-label='コンポーネントの設定'
            className='w-72 shrink-0 space-y-4 rounded-md border border-border p-4'
        >
            <h2 className='text-sm font-semibold'>{panel.name}</h2>
            {/* ブロックが変わったらフォームを作り直す（入力中の値・エラーを持ち越さない） */}
            <div key={block.id}>{form}</div>
        </aside>
    )
}
