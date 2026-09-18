import { cn } from '@fesp/ui'

export type DayBadgeProps = {
    /** 開催日の順番（1日目なら `1`） */
    day: number
    /** バッジの色（`cardColors` の `accent` など） */
    className?: string
}

/**
 * 開催日のバッジ（`Day1` など）。丸い枠に白い文字で出す。
 * 模擬店・出演者のカードとサマリー、マップの場所の一覧で使う
 */
export function DayBadge({ day, className }: DayBadgeProps) {
    return (
        <span className={cn('font-en rounded-full px-3 py-1 text-xs font-bold text-white', className)}>Day{day}</span>
    )
}
