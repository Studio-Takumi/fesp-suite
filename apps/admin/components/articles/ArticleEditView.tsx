'use client'

import Link from 'next/link'
import { useState } from 'react'

import { useQuery } from '@tanstack/react-query'

import type { ArticleDocument, ArticleResponse } from '@fesp/schema'
import { ApiError } from '@fesp/types'

import { ArticleEditor } from '~/components/editor/ArticleEditor'
import { Button } from '~/components/ui/button'
import { articleQuery, useUpdateArticle } from '~/lib/queries'

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

    const handleChange = (nextDocument: ArticleDocument) => {
        setArticleDocument(nextDocument)
        if (updateArticle.isSuccess) updateArticle.reset()
    }

    return (
        <div className='space-y-6 p-8'>
            <div className='flex items-center justify-between'>
                <h1 className='text-2xl font-bold'>記事エディタ</h1>
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
                    <Button
                        onClick={() => updateArticle.mutate({ content: articleDocument })}
                        disabled={updateArticle.isPending}
                    >
                        保存
                    </Button>
                </div>
            </div>

            <ArticleEditor content={article.content} onChange={handleChange} />

            <details className='rounded-md border border-border p-4 text-sm'>
                <summary className='cursor-pointer font-medium'>JSON（確認用）</summary>
                <pre className='mt-2 overflow-x-auto whitespace-pre-wrap'>
                    {JSON.stringify(articleDocument, null, 2)}
                </pre>
            </details>
        </div>
    )
}
