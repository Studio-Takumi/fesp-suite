'use client'

import { createReactBlockSpec, useEditorState } from '@blocknote/react'
import { CalendarClock } from 'lucide-react'

import { ComponentBlockCard } from './ComponentBlockCard'

/**
 * スケジュール表（`scheduleTable`）。デザインの `web / Schedule / iPhone` の日付タブ・会場ヘッダー・時間のグリッド。
 * 中身を持たない独自コンポーネントのブロックで、props はサイドパネル（ComponentPropsPanel）で編集する。
 * エディタ上ではカード（ComponentBlockCard）の中に設定の要約だけを出し、スケジュールのデータは出さない
 */
export const createScheduleTableBlock = createReactBlockSpec(
    {
        type: 'scheduleTable',
        propSchema: {
            showDateTabs: { default: true },
        },
        content: 'none',
    },
    {
        render: function ScheduleTableBlock({ block, editor }) {
            const isSelected = useEditorState({
                editor,
                selector: ({ editor }) => editor.getTextCursorPosition().block.id === block.id,
            })

            return (
                <ComponentBlockCard icon={<CalendarClock size={14} />} name='スケジュール表' isSelected={isSelected}>
                    <div className='text-sm text-slate-700'>日付タブ: {block.props.showDateTabs ? 'あり' : 'なし'}</div>
                </ComponentBlockCard>
            )
        },
    },
)
