/**
 * 個別ページ（お知らせ・ブログ・模擬店・出演者）の仮の本文。
 * 種類ごとのデータ（#56〜#60）ができるまで、ページはこのブロックを描画する。
 * 種類ごとの記事を引けるようになったら、このファイルは消す
 */
import type { ArticleBlock, ArticleDocument } from '@fesp/schema'

const defaultProps = { backgroundColor: 'default', textColor: 'default', textAlignment: 'left' } as const

function paragraph(id: string, text: string): ArticleBlock {
    return {
        id,
        type: 'paragraph',
        props: defaultProps,
        content: [{ type: 'text', text, styles: {} }],
        children: [],
    }
}

/** props を持たない独自コンポーネントのブロック */
function component(id: string, type: ArticleBlock['type']): ArticleBlock {
    return { id, type, props: {}, children: [] }
}

const coverPhoto = 'https://images.unsplash.com/photo-1678964335849-30d96ce65870?w=1080&q=80'

/** お知らせ1件（`/news/:postId`） */
export const newsPostArticle: ArticleDocument = [
    { id: 'news-post-cover', type: 'coverImage', props: { imageUrl: coverPhoto }, children: [] },
    component('news-post-summary', 'postSummary'),
    paragraph('news-post-body-1', '2日目のステージは、雨天のため体育館に会場を変更します。'),
    paragraph('news-post-body-2', '開始時刻は変わりません。お手数ですが、体育館の入口までお越しください。'),
    component('news-post-adjacent', 'adjacentPosts'),
]

/** ブログ1件（`/blog/:postId`） */
export const blogPostArticle: ArticleDocument = [
    { id: 'blog-post-cover', type: 'coverImage', props: { imageUrl: coverPhoto }, children: [] },
    component('blog-post-summary', 'postSummary'),
    paragraph('blog-post-body-1', '今年の看板づくりは、3年生の有志が中心になって進めました。'),
    paragraph('blog-post-body-2', '当日は正門の横に立てるので、来場されたらぜひ見上げてみてください。'),
    component('blog-post-related', 'relatedPosts'),
]

/** 模擬店1件（`/shop/:shopId`） */
export const shopArticle: ArticleDocument = [
    component('shop-detail-summary', 'shopSummary'),
    { id: 'shop-detail-products', type: 'productList', props: { products: '' }, children: [] },
]

/** 出演者1件（`/artist/:artistId`） */
export const artistArticle: ArticleDocument = [
    component('artist-detail-summary', 'artistSummary'),
    component('artist-detail-set-list', 'setList'),
]
