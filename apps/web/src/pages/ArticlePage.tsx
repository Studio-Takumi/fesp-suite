import { useQuery } from '@tanstack/react-query'
import { useParams } from '@tanstack/react-router'

import { ArticleRenderer } from '~/components/article/ArticleRenderer'
import { QueryBoundary } from '~/components/query-boundary'
import { articleQuery } from '~/lib/queries'

/** 記事1件のタイトルと本文を表示する */
export function ArticlePage() {
    const { articleId } = useParams({ from: '/articles/$articleId' })
    const article = useQuery(articleQuery(articleId))

    return (
        <QueryBoundary isPending={article.isPending} error={article.error} data={article.data}>
            {(data) => (
                <article className='space-y-6'>
                    <h1 className='text-2xl font-bold'>{data.title || '（無題）'}</h1>
                    <ArticleRenderer blocks={data.content} />
                </article>
            )}
        </QueryBoundary>
    )
}
