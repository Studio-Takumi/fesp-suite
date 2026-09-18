import { ArticleBody } from '~/components/article/ArticleBody'
import { artistArticle } from '~/lib/mock/preview-articles'

/** 出演者1件の仮ページ（`/artist/:artistId`）。出演者のデータ（#60）ができるまで、決まった内容を出す */
export function ArtistPage() {
    return <ArticleBody blocks={artistArticle} />
}
