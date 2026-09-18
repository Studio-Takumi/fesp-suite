import { useQuery } from '@tanstack/react-query'
import { useParams } from '@tanstack/react-router'

import { ArticleBody } from '~/components/article/ArticleBody'
import { QueryBoundary } from '~/components/QueryBoundary'
import { articleQuery } from '~/lib/queries'

/** 記事1件の本文を表示する。ページのタイトルは本文のページ見出し（`pageHeader`）が出すので、記事のタイトルは出さない */
export function ArticlePage() {
    const { articleId } = useParams({ from: '/_authenticated/articles/$articleId' })
    const article = useQuery(articleQuery(articleId))

    return (
        <QueryBoundary isPending={article.isPending} error={article.error} data={article.data}>
            {(data) => <ArticleBody blocks={data.content} />}
        </QueryBoundary>
    )
}
