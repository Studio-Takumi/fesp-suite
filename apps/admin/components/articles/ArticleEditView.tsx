'use client'

import Link from 'next/link'
import { useState } from 'react'

import { zodResolver } from '@hookform/resolvers/zod'
import { useQuery } from '@tanstack/react-query'
import { Controller, useForm } from 'react-hook-form'
import type { z } from 'zod'

import { type ArticleDocument, articleInputSchema, type ArticleResponse } from '@fesp/schema'
import { ApiError } from '@fesp/types'

import { ArticleEditor } from '~/components/editor/ArticleEditor'
import { Button } from '~/components/ui/button'
import { Input } from '~/components/ui/input'
import { Label } from '~/components/ui/label'
import { Switch } from '~/components/ui/switch'
import { articleQuery, useUpdateArticle } from '~/lib/queries'

/** 本文は BlockNote の変更を state で持つので、フォームで扱うのはタイトルと公開状態 */
const articleFormSchema = articleInputSchema.pick({ title: true, status: true })

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
    const [articleDocument, setArticleDocument] = useState<ArticleDocument>(article.content)
    const updateArticle = useUpdateArticle(article.id)
    const {
        register,
        control,
        handleSubmit,
        formState: { errors },
    } = useForm<ArticleFormValues, unknown, ArticleFormOutput>({
        resolver: zodResolver(articleFormSchema),
        defaultValues: { title: article.title, status: article.status },
    })

    const clearSavedStatus = () => {
        if (updateArticle.isSuccess) updateArticle.reset()
    }

    const handleDocumentChange = (nextDocument: ArticleDocument) => {
        setArticleDocument(nextDocument)
        clearSavedStatus()
    }

    const handleSave = handleSubmit(({ title, status }) =>
        updateArticle.mutate({ title, content: articleDocument, status }),
    )

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
                    </div>
                    <div className='flex items-center gap-3'>
                        {updateArticle.isSuccess ? (
                            <p role='status' className='text-sm text-muted-foreground'>
                                保存しました
                            </p>
                        ) : null}
                        {updateArticle.isError ? (
                            <p role='alert' className='text-sm text-destructive'>
                                {updateArticle.error.message}
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
                                        onCheckedChange={(checked) => {
                                            field.onChange(checked ? 'published' : 'draft')
                                            clearSavedStatus()
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
                        {...register('title', { onChange: clearSavedStatus })}
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

            <ArticleEditor content={article.content} onChange={handleDocumentChange} />

            <details className='rounded-md border border-border p-4 text-sm'>
                <summary className='cursor-pointer font-medium'>JSON（確認用）</summary>
                <pre className='mt-2 overflow-x-auto whitespace-pre-wrap'>
                    {JSON.stringify(articleDocument, null, 2)}
                </pre>
            </details>
        </div>
    )
}
