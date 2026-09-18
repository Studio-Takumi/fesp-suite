import { ArticleBody } from '~/components/article/ArticleBody'
import { newsPostArticle } from '~/lib/mock/preview-articles'

/** お知らせ1件の仮ページ（`/news/:postId`）。お知らせのデータ（#56）ができるまで、決まった内容を出す */
export function NewsPostPage() {
    return <ArticleBody blocks={newsPostArticle} />
}
