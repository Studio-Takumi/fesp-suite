'use client'

import { type FormEvent, useState } from 'react'

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
import { Input } from '~/components/ui/input'
import { Label } from '~/components/ui/label'

/** `datetime-local` の入力値の形（分まで） */
const DATETIME_LOCAL_FORMAT = 'YYYY-MM-DDTHH:mm'

/** `datetime-local` の入力値を日本時間として扱い、オフセット付きの ISO 8601 にする */
function toPublishAt(value: string): string {
    return `${value}:00+09:00`
}

type ScheduleFormProps = {
    /** 予約があれば予約の日時。入力欄の初期値にする */
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
    const [value, setValue] = useState(() =>
        defaultPublishAt ? dateFormatter(defaultPublishAt, DATETIME_LOCAL_FORMAT) : '',
    )
    const [inputError, setInputError] = useState<string | null>(null)

    const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault()
        const publishAt = articlePublishAtSchema.safeParse(value ? toPublishAt(value) : '')
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
                <Label htmlFor='article-publish-at'>公開する日時</Label>
                <Input
                    id='article-publish-at'
                    type='datetime-local'
                    value={value}
                    onChange={(event) => setValue(event.target.value)}
                    aria-invalid={Boolean(inputError)}
                    aria-describedby={inputError ? 'publish-at-error' : undefined}
                />
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
