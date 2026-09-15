'use client'

import Link from 'next/link'
import { useState } from 'react'

import { zodResolver } from '@hookform/resolvers/zod'
import { useQuery } from '@tanstack/react-query'
import { Controller, useForm } from 'react-hook-form'
import type { z } from 'zod'

import { type ArticleDocument, articleInputSchema, type ArticleResponse } from '@fesp/schema'
import { ApiError } from '@fesp/types'
import { dateFormatter } from '@fesp/ui'

import { ArticleScheduleDialog } from '~/components/articles/ArticleScheduleDialog'
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
import { articleQuery, useCancelArticleSchedule, useScheduleArticle, useUpdateArticle } from '~/lib/queries'

/** 本文は BlockNote の変更を state で持つので、フォームで扱うのはタイトルと公開状態 */
const articleFormSchema = articleInputSchema.pick({ title: true, status: true }).required()

/** zod の .trim() があるため、フォームの入力型（input）と送信型（output）は別物になる */
type ArticleFormValues = z.input<typeof articleFormSchema>
type ArticleFormOutput = z.output<typeof articleFormSchema>

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
    const [articleDocument, setArticleDocument] = useState<ArticleDocument>(initial.content)
    /** 公開中の記事を公開のまま保存しようとしたときのタイトル。ダイアログを開いている間だけ入る */
    const [pendingTitle, setPendingTitle] = useState<string | null>(null)
    const [isScheduleDialogOpen, setIsScheduleDialogOpen] = useState(false)
    const updateArticle = useUpdateArticle(article.id)
    const scheduleArticle = useScheduleArticle(article.id)
    const cancelSchedule = useCancelArticleSchedule(article.id)
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

    /** 「保存しました」「予約しました」「予約を取り消しました」を消す */
    const clearNotices = () => {
        if (updateArticle.isSuccess) updateArticle.reset()
        if (scheduleArticle.isSuccess) scheduleArticle.reset()
        if (cancelSchedule.isSuccess) cancelSchedule.reset()
    }

    const handleDocumentChange = (nextDocument: ArticleDocument) => {
        setArticleDocument(nextDocument)
        clearNotices()
    }

    const handleSave = handleSubmit(({ title, status }) => {
        clearNotices()
        // 公開中の記事を公開のまま保存するときは、公開に反映するか一時保存にするかを選んでもらう
        if (article.status === 'published' && status === 'published') {
            setPendingTitle(title)
            return
        }
        updateArticle.mutate({ title, content: articleDocument, status })
    })

    /** ダイアログの選択で保存する。status を送らなければ一時保存（公開中の記事は変えない） */
    const saveWhilePublished = (status?: 'published') => () => {
        if (pendingTitle === null) return
        updateArticle.mutate(
            status
                ? { title: pendingTitle, content: articleDocument, status }
                : { title: pendingTitle, content: articleDocument },
        )
    }

    const openScheduleDialog = () => {
        if (scheduleArticle.isError) scheduleArticle.reset()
        setIsScheduleDialogOpen(true)
    }

    /** 今の中身を保存して、保存した最新の版を予約する。公開のスイッチは使わない */
    const handleSchedule = (publishAt: string) =>
        handleSubmit(
            ({ title }) => {
                clearNotices()
                scheduleArticle.mutate(
                    { title, content: articleDocument, publish_at: publishAt },
                    { onSuccess: () => setIsScheduleDialogOpen(false) },
                )
            },
            // タイトルのエラーはタイトルの入力欄の下に出すので、ダイアログは閉じる
            () => setIsScheduleDialogOpen(false),
        )()

    const handleCancelSchedule = () => {
        clearNotices()
        cancelSchedule.mutate()
    }

    return (
        <div className='space-y-6 p-8'>
            {/* BlockNote のツールバーのボタンで送信されないよう、エディタはフォームの外に置く */}
            <form onSubmit={handleSave} className='space-y-6' noValidate>
                <div className='flex items-center justify-between'>
                    <div className='space-y-1'>
                        <h1 className='text-2xl font-bold'>記事エディタ</h1>
                        <p className='text-sm text-muted-foreground'>
                            {`作成者: ${article.creator.display_name ?? '（名前未設定）'}`}
                        </p>
                        {hasUnpublishedChanges ? (
                            <p className='text-sm text-muted-foreground'>公開していない変更があります</p>
                        ) : null}
                        {article.schedule ? (
                            <div className='flex items-center gap-3'>
                                <p className='text-sm text-muted-foreground'>
                                    {`${dateFormatter(article.schedule.publish_at, 'YYYY/MM/DD HH:mm')} に公開予定`}
                                </p>
                                <Button
                                    type='button'
                                    variant='outline'
                                    size='sm'
                                    onClick={handleCancelSchedule}
                                    disabled={cancelSchedule.isPending}
                                >
                                    予約を取り消す
                                </Button>
                            </div>
                        ) : null}
                        {hasChangesAfterSchedule ? (
                            <p className='text-sm text-muted-foreground'>
                                予約した版のあとに保存した変更があります（予約には入りません）
                            </p>
                        ) : null}
                        {cancelSchedule.isError ? (
                            <p role='alert' className='text-sm text-destructive'>
                                {cancelSchedule.error.message}
                            </p>
                        ) : null}
                    </div>
                    <div className='flex items-center gap-3'>
                        {updateArticle.isSuccess ? (
                            <p role='status' className='text-sm text-muted-foreground'>
                                保存しました
                            </p>
                        ) : null}
                        {scheduleArticle.isSuccess ? (
                            <p role='status' className='text-sm text-muted-foreground'>
                                予約しました
                            </p>
                        ) : null}
                        {cancelSchedule.isSuccess ? (
                            <p role='status' className='text-sm text-muted-foreground'>
                                予約を取り消しました
                            </p>
                        ) : null}
                        {updateArticle.isError ? (
                            <p role='alert' className='text-sm text-destructive'>
                                {updateArticle.error.message}
                            </p>
                        ) : null}
                        <Button type='button' variant='outline' onClick={openScheduleDialog}>
                            予約
                        </Button>
                        <Controller
                            control={control}
                            name='status'
                            render={({ field }) => (
                                <div className='flex items-center gap-2'>
                                    <Switch
                                        id='article-published'
                                        checked={field.value === 'published'}
                                        onCheckedChange={(checked) => {
                                            field.onChange(checked ? 'published' : 'draft')
                                            clearNotices()
                                        }}
                                    />
                                    <Label htmlFor='article-published'>公開</Label>
                                </div>
                            )}
                        />
                        <Button type='submit' disabled={updateArticle.isPending}>
                            保存
                        </Button>
                    </div>
                </div>

                <div className='space-y-2'>
                    <Input
                        aria-label='タイトル'
                        placeholder='タイトル'
                        {...register('title', { onChange: clearNotices })}
                        aria-invalid={Boolean(errors.title)}
                        aria-describedby={errors.title ? 'title-error' : undefined}
                    />
                    {errors.title ? (
                        <p id='title-error' role='alert' className='text-sm text-destructive'>
                            {errors.title.message}
                        </p>
                    ) : null}
                </div>
            </form>

            <AlertDialog
                open={pendingTitle !== null}
                onOpenChange={(open) => {
                    if (!open) setPendingTitle(null)
                }}
            >
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>公開中の記事です</AlertDialogTitle>
                        <AlertDialogDescription>
                            一時保存すると、公開中の記事はそのままで変更だけを保存します。
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>キャンセル</AlertDialogCancel>
                        <AlertDialogAction variant='outline' onClick={saveWhilePublished()}>
                            一時保存する
                        </AlertDialogAction>
                        <AlertDialogAction onClick={saveWhilePublished('published')}>公開に反映する</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {/* 予約ダイアログのフォームの送信が記事のフォームに伝わらないよう、記事のフォームの外に置く */}
            <ArticleScheduleDialog
                open={isScheduleDialogOpen}
                onOpenChange={setIsScheduleDialogOpen}
                defaultPublishAt={article.schedule?.publish_at ?? null}
                isPending={scheduleArticle.isPending}
                errorMessage={scheduleArticle.isError ? scheduleArticle.error.message : null}
                onSubmit={handleSchedule}
            />

            <ArticleEditor content={initial.content} onChange={handleDocumentChange} />

            <details className='rounded-md border border-border p-4 text-sm'>
                <summary className='cursor-pointer font-medium'>JSON（確認用）</summary>
                <pre className='mt-2 overflow-x-auto whitespace-pre-wrap'>
                    {JSON.stringify(articleDocument, null, 2)}
                </pre>
            </details>
        </div>
    )
}
