import { ArticleBody } from '~/components/article/ArticleBody'
import { shopArticle } from '~/lib/mock/preview-articles'

/** 模擬店1件の仮ページ（`/shop/:shopId`）。模擬店のデータ（#59）ができるまで、決まった内容を出す */
export function ShopPage() {
    return <ArticleBody blocks={shopArticle} />
}
