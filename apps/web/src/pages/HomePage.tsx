import { homeArticleSlug } from '@fesp/schema'

import { ArticleBySlug } from '~/components/article/ArticleBySlug'

/** ホーム（`/`）。slug が `home` の記事を出す。中身は固定ページと同じ仕組み（docs/app.md） */
export function HomePage() {
    return <ArticleBySlug slug={homeArticleSlug} />
}
