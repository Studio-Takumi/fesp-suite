import type { ArticleDocument } from '@fesp/schema'

import { ArticleRenderer } from './ArticleRenderer'

/** 記事の本文。どのページも同じ間隔で描画する（読み込みはページ側でする） */
export function ArticleBody({ blocks }: { blocks: ArticleDocument }) {
    return (
        <article className='space-y-6'>
            <ArticleRenderer blocks={blocks} />
        </article>
    )
}
