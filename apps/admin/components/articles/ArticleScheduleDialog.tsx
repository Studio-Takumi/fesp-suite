'use client'

import { type FormEvent, useState } from 'react'

import { ja } from 'date-fns/locale'

import { articlePublishAtSchema } from '@fesp/schema'
import { dateFormatter } from '@fesp/ui'

import {
    AlertDialog,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '~/components/ui/alert-dialog'
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

type ScheduleFormProps = {
    /** 予約があれば予約の日時。日付・時刻の初期値にする */
    defaultPublishAt: string | null
    isPending: boolean
    /** 保存・予約に失敗したときのメッセージ */
    errorMessage: string | null
    /** 現在より後の日時（オフセット付きの ISO 8601）を渡す */
    onSubmit: (publishAt: string) => void
}

export type ArticleScheduleDialogProps = ScheduleFormProps & {
    open: boolean
    onOpenChange: (open: boolean) => void
}

export function ArticleScheduleDialog({ open, onOpenChange, ...formProps }: ArticleScheduleDialogProps) {
    return (
        <AlertDialog open={open} onOpenChange={onOpenChange}>
            <AlertDialogContent>
                {/* 閉じるとフォームごと消えるので、開くたびに初期値から始まる */}
                <ScheduleForm {...formProps} />
            </AlertDialogContent>
        </AlertDialog>
    )
}

function ScheduleForm({ defaultPublishAt, isPending, errorMessage, onSubmit }: ScheduleFormProps) {
    // 予約の日時は日本時間で出す（dateFormatter は端末のタイムゾーンによらず日本時間にする）
    const [date, setDate] = useState(() => (defaultPublishAt ? dateFormatter(defaultPublishAt, 'YYYY-MM-DD') : ''))
    const [time, setTime] = useState(() => (defaultPublishAt ? dateFormatter(defaultPublishAt, 'HH:mm') : ''))
    const [isCalendarOpen, setIsCalendarOpen] = useState(false)
    const [inputError, setInputError] = useState<string | null>(null)

    const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault()
        const publishAt = articlePublishAtSchema.safeParse(date && time ? `${date}T${time}:00${JST_OFFSET}` : '')
        if (!publishAt.success) {
            setInputError('現在より後の日時を指定してください')
            return
        }
        setInputError(null)
        onSubmit(publishAt.data)
    }

    return (
        <form onSubmit={handleSubmit} className='grid gap-4' noValidate>
            <AlertDialogHeader>
                <AlertDialogTitle>予約投稿</AlertDialogTitle>
                <AlertDialogDescription>今の内容を保存して、指定した日時に公開します。</AlertDialogDescription>
            </AlertDialogHeader>
            <div className='space-y-2'>
                <div className='flex gap-2'>
                    <div className='space-y-2'>
                        <Label htmlFor='article-publish-date'>公開する日付</Label>
                        <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
                            <PopoverTrigger asChild>
                                <Button id='article-publish-date' type='button' variant='outline'>
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
                                    onSelect={(selected) => {
                                        if (selected) setDate(toDateValue(selected))
                                        setIsCalendarOpen(false)
                                    }}
                                />
                            </PopoverContent>
                        </Popover>
                    </div>
                    <div className='space-y-2'>
                        <Label htmlFor='article-publish-time'>公開する時刻</Label>
                        <Input
                            id='article-publish-time'
                            type='time'
                            value={time}
                            onChange={(event) => setTime(event.target.value)}
                            aria-invalid={Boolean(inputError)}
                            aria-describedby={inputError ? 'publish-at-error' : undefined}
                        />
                    </div>
                </div>
                {inputError ? (
                    <p id='publish-at-error' role='alert' className='text-sm text-destructive'>
                        {inputError}
                    </p>
                ) : null}
                {errorMessage ? (
                    <p role='alert' className='text-sm text-destructive'>
                        {errorMessage}
                    </p>
                ) : null}
            </div>
            <AlertDialogFooter>
                <AlertDialogCancel type='button'>キャンセル</AlertDialogCancel>
                <Button type='submit' disabled={isPending}>
                    予約する
                </Button>
            </AlertDialogFooter>
        </form>
    )
}
