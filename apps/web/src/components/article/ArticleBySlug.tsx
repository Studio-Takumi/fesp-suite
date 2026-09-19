import { useQuery } from '@tanstack/react-query'

import { QueryBoundary } from '~/components/QueryBoundary'
import { articleBySlugQuery } from '~/lib/queries'

import { ArticleBody } from './ArticleBody'

/**
 * slug で記事を引いて本文を出す。固定ページ・ホーム・2ペインの一覧側が共通で使う。
 * ページのタイトルは本文のページ見出し（`pageHeader`）が出すので、記事のタイトルは出さない
 */
export function ArticleBySlug({ slug }: { slug: string }) {
    const article = useQuery(articleBySlugQuery(slug))

    return (
        <QueryBoundary isPending={article.isPending} error={article.error} data={article.data}>
            {(data) => <ArticleBody blocks={data.content} />}
        </QueryBoundary>
    )
}
