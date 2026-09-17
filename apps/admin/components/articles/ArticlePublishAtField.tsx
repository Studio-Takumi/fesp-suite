'use client'

import { ja } from 'date-fns/locale'

import { articlePublishAtSchema } from '@fesp/schema'
import { dateFormatter } from '@fesp/ui'

import { Button } from '~/components/ui/button'
import { Calendar } from '~/components/ui/calendar'
import { Input } from '~/components/ui/input'
import { Label } from '~/components/ui/label'
import { Popover, PopoverContent, PopoverTrigger } from '~/components/ui/popover'

/** 日本時間のオフセット。入力した日時は、見ている端末のタイムゾーンによらず日本時間として扱う */
const JST_OFFSET = '+09:00'

/** カレンダーの見出し。ロケールの既定（`9月 2026`）ではなく `2026年9月` で出す */
function formatCalendarCaption(date: Date): string {
    return `${date.getFullYear()}年${date.getMonth() + 1}月`
}

/** カレンダーで選んだ日（端末のタイムゾーンの0時）を `YYYY-MM-DD` にする */
function toDateValue(date: Date): string {
    const month = `${date.getMonth() + 1}`.padStart(2, '0')
    const day = `${date.getDate()}`.padStart(2, '0')
    return `${date.getFullYear()}-${month}-${day}`
}

/** `YYYY-MM-DD` をカレンダーが扱う日（端末のタイムゾーンの0時）にする */
function toCalendarDate(value: string): Date {
    return new Date(`${value}T00:00:00`)
}

/** 予約の日時を、入力欄の日付（`YYYY-MM-DD`）と時刻（`HH:mm`）に分ける。予約が無ければ両方とも空 */
export function publishAtFieldsOf(publishAt: string | null): { date: string; time: string } {
    if (!publishAt) return { date: '', time: '' }
    return { date: dateFormatter(publishAt, 'YYYY-MM-DD'), time: dateFormatter(publishAt, 'HH:mm') }
}

/**
 * 入力欄の日付・時刻から、予約する日時（オフセット付きの ISO 8601）を作る。
 * 両方とも空なら `null`（予約しない・予約を取り消す）
 */
export function resolvePublishAt(date: string, time: string): { publishAt: string | null } | { error: string } {
    if (!date && !time) return { publishAt: null }
    if (!date || !time) return { error: '日付と時刻の両方を指定してください' }

    const parsed = articlePublishAtSchema.safeParse(`${date}T${time}:00${JST_OFFSET}`)
    if (!parsed.success) return { error: '現在より後の日時を指定してください' }

    return { publishAt: parsed.data }
}

export type ArticlePublishAtFieldProps = {
    /** `YYYY-MM-DD`。未選択なら空 */
    date: string
    /** `HH:mm`。未入力なら空 */
    time: string
    onDateChange: (date: string) => void
    onTimeChange: (time: string) => void
    /** 日付・時刻をどちらも空にする */
    onClear: () => void
    /** 日付・時刻のエラー。無ければ `null` */
    error: string | null
}

export function ArticlePublishAtField({
    date,
    time,
    onDateChange,
    onTimeChange,
    onClear,
    error,
}: ArticlePublishAtFieldProps) {
    return (
        <div className='space-y-2'>
            <Label htmlFor='article-publish-date'>公開日時</Label>
            <div className='flex items-center gap-2'>
                <Popover>
                    <PopoverTrigger asChild>
                        <Button
                            id='article-publish-date'
                            type='button'
                            variant='outline'
                            aria-invalid={Boolean(error)}
                            aria-describedby={error ? 'publish-at-error' : undefined}
                        >
                            {date ? dateFormatter(toCalendarDate(date), 'YYYY/MM/DD') : '日付を選ぶ'}
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent className='w-auto p-0'>
                        <Calendar
                            mode='single'
                            // 曜日・読み上げ用のラベルを日本語にする（曜日は 日〜土）
                            locale={ja}
                            formatters={{ formatCaption: formatCalendarCaption }}
                            selected={date ? toCalendarDate(date) : undefined}
                            defaultMonth={date ? toCalendarDate(date) : undefined}
                            // 選んでいる日をもう一度押すと選択が外れる（selected が undefined になる）
                            onSelect={(selected) => onDateChange(selected ? toDateValue(selected) : '')}
                        />
                    </PopoverContent>
                </Popover>
                <Input
                    aria-label='公開する時刻'
                    type='time'
                    className='w-auto'
                    value={time}
                    onChange={(event) => onTimeChange(event.target.value)}
                    aria-invalid={Boolean(error)}
                    aria-describedby={error ? 'publish-at-error' : undefined}
                />
                {date || time ? (
                    <Button type='button' variant='ghost' size='sm' onClick={onClear}>
                        日時をクリア
                    </Button>
                ) : null}
            </div>
            {error ? (
                <p id='publish-at-error' role='alert' className='text-sm text-destructive'>
                    {error}
                </p>
            ) : null}
        </div>
    )
}
