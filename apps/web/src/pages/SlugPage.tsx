import { useQuery } from '@tanstack/react-query'
import { useParams } from '@tanstack/react-router'

import { ArticleBody } from '~/components/article/ArticleBody'
import { QueryBoundary } from '~/components/QueryBoundary'
import { articleBySlugQuery } from '~/lib/queries'

/**
 * 固定ページ（`/:articleSlug`）。slug で記事を引いて本文を表示する。
 * ページのタイトルは本文のページ見出し（`pageHeader`）が出すので、記事のタイトルは出さない
 */
export function SlugPage() {
    const { articleSlug } = useParams({ from: '/_authenticated/$articleSlug' })
    const article = useQuery(articleBySlugQuery(articleSlug))

    return (
        <QueryBoundary isPending={article.isPending} error={article.error} data={article.data}>
            {(data) => <ArticleBody blocks={data.content} />}
        </QueryBoundary>
    )
}
