import { useQuery } from '@tanstack/react-query'

import { homeArticleSlug } from '@fesp/schema'

import { ArticleBody } from '~/components/article/ArticleBody'
import { QueryBoundary } from '~/components/QueryBoundary'
import { articleBySlugQuery } from '~/lib/queries'

/** ホーム（`/`）。slug が `home` の記事を出す。中身は固定ページと同じ仕組み（docs/app.md） */
export function HomePage() {
    const article = useQuery(articleBySlugQuery(homeArticleSlug))

    return (
        <QueryBoundary isPending={article.isPending} error={article.error} data={article.data}>
            {(data) => <ArticleBody blocks={data.content} />}
        </QueryBoundary>
    )
}
