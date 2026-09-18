import { ArticleBody } from '~/components/article/ArticleBody'
import { blogPostArticle } from '~/lib/mock/preview-articles'

/** ブログ1件の仮ページ（`/blog/:postId`）。ブログのデータ（#57）ができるまで、決まった内容を出す */
export function BlogPostPage() {
    return <ArticleBody blocks={blogPostArticle} />
}
