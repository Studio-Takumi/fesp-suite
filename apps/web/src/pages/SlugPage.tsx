import { useParams } from '@tanstack/react-router'

import { ArticleBySlug } from '~/components/article/ArticleBySlug'

/**
 * 固定ページ（`/:articleSlug`）。slug で記事を引いて本文を表示する。
 * ページのタイトルは本文のページ見出し（`pageHeader`）が出すので、記事のタイトルは出さない
 */
export function SlugPage() {
    const { articleSlug } = useParams({ from: '/_authenticated/$articleSlug' })

    return <ArticleBySlug slug={articleSlug} />
}
