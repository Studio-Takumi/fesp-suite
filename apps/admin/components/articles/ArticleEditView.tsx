'use client'

import Link from 'next/link'
import { useState } from 'react'

import { zodResolver } from '@hookform/resolvers/zod'
import { useQuery } from '@tanstack/react-query'
import { Controller, useForm } from 'react-hook-form'
import type { z } from 'zod'

import { type ArticleDocument, articleInputSchema, type ArticleResponse, type ArticleStatus } from '@fesp/schema'
import { ApiError } from '@fesp/types'
import { dateFormatter } from '@fesp/ui'

import { ArticlePublishAtField, publishAtFieldsOf, resolvePublishAt } from '~/components/articles/ArticlePublishAtField'
import { ArticleEditor } from '~/components/editor/ArticleEditor'
import {
    AlertDialog,
    AlertDialogAction,
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
import { Switch } from '~/components/ui/switch'
import { articleQuery, useSaveArticle } from '~/lib/queries'

/** 本文は BlockNote の変更を、公開日時は入力欄の値を state で持つので、フォームで扱うのはタイトルと公開状態 */
const articleFormSchema = articleInputSchema.pick({ title: true, status: true }).required()

/** zod の .trim() があるため、フォームの入力型（input）と送信型（output）は別物になる */
type ArticleFormValues = z.input<typeof articleFormSchema>
type ArticleFormOutput = z.output<typeof articleFormSchema>

/** 保存したときに出す表示。予約したか、予約を取り消したかで変える */
type SaveInput = { title: string; status?: ArticleStatus; publishAt: string | null }

export type ArticleEditViewProps = {
    id: string
}

export function ArticleEditView({ id }: ArticleEditViewProps) {
    const article = useQuery(articleQuery(id))

    if (article.isPending) {
        return (
            <div className='p-8'>
                <p className='text-sm text-muted-foreground'>読み込み中…</p>
            </div>
        )
    }

    if (article.isError) {
        const isNotFound = article.error instanceof ApiError && article.error.isNotFound
        return (
            <div className='space-y-4 p-8'>
                {isNotFound ? (
                    <p>記事が見つかりません</p>
                ) : (
                    <p role='alert' className='text-sm text-destructive'>
                        {article.error.message}
                    </p>
                )}
                <Link href='/articles' className='text-sm underline'>
                    記事一覧へ戻る
                </Link>
            </div>
        )
    }

    return <ArticleForm article={article.data} />
}

function ArticleForm({ article }: { article: ArticleResponse }) {
    // 公開中の記事を一時保存した変更は最新の版にだけ入るので、最新の版から編集を始める
    const initial = article.latest_history ?? article
    const initialPublishAt = publishAtFieldsOf(article.schedule?.publish_at ?? null)
    const [articleDocument, setArticleDocument] = useState<ArticleDocument>(initial.content)
    const [publishDate, setPublishDate] = useState(initialPublishAt.date)
    const [publishTime, setPublishTime] = useState(initialPublishAt.time)
    const [publishAtError, setPublishAtError] = useState<string | null>(null)
    /** 公開中の記事を公開のまま保存しようとしたときの入力。ダイアログを開いている間だけ入る */
    const [pendingSave, setPendingSave] = useState<SaveInput | null>(null)
    /** 保存できたときに出す文言。予約したか、予約を取り消したかで変わる */
    const [savedNotice, setSavedNotice] = useState('保存しました')
    const saveArticle = useSaveArticle(article.id)
    const {
        register,
        control,
        handleSubmit,
        formState: { errors },
    } = useForm<ArticleFormValues, unknown, ArticleFormOutput>({
        resolver: zodResolver(articleFormSchema),
        defaultValues: { title: initial.title, status: article.status },
    })

    const hasUnpublishedChanges =
        article.status === 'published' &&
        article.latest_history !== null &&
        article.latest_history.version !== article.published_version

    /** 予約した版のあとに保存した変更（予約には入らない）があるか */
    const hasChangesAfterSchedule =
        article.schedule !== null &&
        article.latest_history !== null &&
        article.latest_history.version !== article.schedule.version

    /** 公開日時が入っている間は、今すぐ公開・下書きに戻すはできない（日時を空にしてもらう） */
    const isScheduling = Boolean(publishDate || publishTime)

    const clearNotice = () => {
        if (saveArticle.isSuccess) saveArticle.reset()
    }

    const handleDocumentChange = (nextDocument: ArticleDocument) => {
        setArticleDocument(nextDocument)
        clearNotice()
    }

    /** 保存する。公開日時が入っていれば予約、空で予約があれば取り消しまで行う（lib/queries.ts） */
    const save = ({ title, status, publishAt }: SaveInput) => {
        setSavedNotice(
            publishAt
                ? '保存して予約しました'
                : article.schedule && status !== 'published'
                  ? '保存して予約を取り消しました'
                  : '保存しました',
        )
        saveArticle.mutate({ title, content: articleDocument, status, publish_at: publishAt })
    }

    const handleSave = handleSubmit(({ title, status }) => {
        clearNotice()

        const resolved = resolvePublishAt(publishDate, publishTime)
        if ('error' in resolved) {
            setPublishAtError(resolved.error)
            return
        }
        setPublishAtError(null)

        // 公開中の記事を公開のまま保存するときは、公開に反映するか一時保存にするかを選んでもらう
        if (article.status === 'published' && status === 'published') {
            setPendingSave({ title, publishAt: resolved.publishAt })
            return
        }
        save({ title, status, publishAt: resolved.publishAt })
    })

    /** ダイアログで「一時保存する」。status を送らないので公開中の中身は変わらない */
    const saveTemporarily = () => {
        if (!pendingSave) return
        save(pendingSave)
    }

    /** ダイアログで「公開に反映する」。予約は DB のトリガーで消えるので、入力欄も空にする */
    const publishNow = () => {
        if (!pendingSave) return
        setPublishDate('')
        setPublishTime('')
        save({ title: pendingSave.title, status: 'published', publishAt: null })
    }

    return (
        <div className='space-y-6 p-8'>
            {/* BlockNote のツールバーのボタンで送信されないよう、エディタはフォームの外に置く */}
            <form onSubmit={handleSave} className='space-y-6' noValidate>
                <div className='flex items-start justify-between'>
                    <div className='space-y-1'>
                        <h1 className='text-2xl font-bold'>記事エディタ</h1>
                        <p className='text-sm text-muted-foreground'>
                            {`作成者: ${article.creator.display_name ?? '（名前未設定）'}`}
                        </p>
                        {hasUnpublishedChanges ? (
                            <p className='text-sm text-muted-foreground'>公開していない変更があります</p>
                        ) : null}
                        {article.schedule ? (
                            <p className='text-sm text-muted-foreground'>
                                {`${dateFormatter(article.schedule.publish_at, 'YYYY/MM/DD HH:mm')} に公開予定`}
                            </p>
                        ) : null}
                        {hasChangesAfterSchedule ? (
                            <p className='text-sm text-muted-foreground'>
                                予約した版のあとに保存した変更があります（予約には入りません）
                            </p>
                        ) : null}
                    </div>
                    <div className='flex items-center gap-3'>
                        {saveArticle.isSuccess ? (
                            <p role='status' className='text-sm text-muted-foreground'>
                                {savedNotice}
                            </p>
                        ) : null}
                        {saveArticle.isError ? (
                            <p role='alert' className='text-sm text-destructive'>
                                {saveArticle.error.message}
                            </p>
                        ) : null}
                        <Controller
                            control={control}
                            name='status'
                            render={({ field }) => (
                                <div className='flex items-center gap-2'>
                                    <Switch
                                        id='article-published'
                                        checked={field.value === 'published'}
                                        disabled={isScheduling}
                                        onCheckedChange={(checked) => {
                                            field.onChange(checked ? 'published' : 'draft')
                                            clearNotice()
                                        }}
                                    />
                                    <Label htmlFor='article-published'>公開</Label>
                                </div>
                            )}
                        />
                        <Button type='submit' disabled={saveArticle.isPending}>
                            保存
                        </Button>
                    </div>
                </div>

                <div className='space-y-2'>
                    <Label htmlFor='article-title'>タイトル</Label>
                    <Input
                        id='article-title'
                        placeholder='タイトル'
                        {...register('title', { onChange: clearNotice })}
                        aria-invalid={Boolean(errors.title)}
                        aria-describedby={errors.title ? 'title-error' : undefined}
                    />
                    {errors.title ? (
                        <p id='title-error' role='alert' className='text-sm text-destructive'>
                            {errors.title.message}
                        </p>
                    ) : null}
                </div>

                <ArticlePublishAtField
                    date={publishDate}
                    time={publishTime}
                    onDateChange={(date) => {
                        setPublishDate(date)
                        clearNotice()
                    }}
                    onTimeChange={(time) => {
                        setPublishTime(time)
                        clearNotice()
                    }}
                    onClear={() => {
                        setPublishDate('')
                        setPublishTime('')
                        clearNotice()
                    }}
                    error={publishAtError}
                />
            </form>

            <AlertDialog
                open={pendingSave !== null}
                onOpenChange={(open) => {
                    if (!open) setPendingSave(null)
                }}
            >
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>公開中の記事です</AlertDialogTitle>
                        <AlertDialogDescription>
                            一時保存すると、公開中の記事はそのままで変更だけを保存します。
                            {pendingSave?.publishAt
                                ? `${dateFormatter(pendingSave.publishAt, 'YYYY/MM/DD HH:mm')} に公開へ反映されます。`
                                : null}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>キャンセル</AlertDialogCancel>
                        <AlertDialogAction variant='outline' onClick={saveTemporarily}>
                            一時保存する
                        </AlertDialogAction>
                        <AlertDialogAction onClick={publishNow}>公開に反映する</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            <div className='space-y-2'>
                <Label>本文</Label>
                <ArticleEditor content={initial.content} onChange={handleDocumentChange} />
            </div>

            <details className='rounded-md border border-border p-4 text-sm'>
                <summary className='cursor-pointer font-medium'>JSON（確認用）</summary>
                <pre className='mt-2 overflow-x-auto whitespace-pre-wrap'>
                    {JSON.stringify(articleDocument, null, 2)}
                </pre>
            </details>
        </div>
    )
}
