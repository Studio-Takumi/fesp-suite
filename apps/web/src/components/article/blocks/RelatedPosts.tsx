import { useQuery } from '@tanstack/react-query'

import { dateFormatter } from '@fesp/ui'

import { QueryBoundary } from '~/components/QueryBoundary'
import type { RelatedPost } from '~/lib/mock/blog'
import { relatedPostsQuery } from '~/lib/queries'

import type { BlockComponentProps } from '../block-registry'

/**
 * 関連する記事（独自コンポーネント `relatedPosts`）。表示中の記事に関連する記事のタイトルと日付を並べる。
 * 0件ならブロックごと出さない
 */
export function RelatedPosts({ children }: BlockComponentProps) {
    const related = useQuery(relatedPostsQuery())

    return (
        <>
            <QueryBoundary isPending={related.isPending} error={related.error} data={related.data}>
                {(posts) =>
                    posts.length > 0 && (
                        <section
                            aria-label='関連する記事'
                            className='flex flex-col gap-3 border-t border-slate-200 pt-3'
                        >
                            <h2 className='text-base font-bold text-slate-900'>関連する記事</h2>
                            <ul className='flex flex-col gap-3'>
                                {posts.map((post) => (
                                    <li key={post.id}>
                                        <RelatedPostLink post={post} />
                                    </li>
                                ))}
                            </ul>
                        </section>
                    )
                }
            </QueryBoundary>
            {children}
        </>
    )
}

type RelatedPostLinkProps = {
    post: RelatedPost
}

function RelatedPostLink({ post }: RelatedPostLinkProps) {
    // デザインは「5月28日」とゼロ埋めしないので、ゼロ埋めした値を数値に戻す
    const month = Number(dateFormatter(post.published_at, 'MM'))
    const day = Number(dateFormatter(post.published_at, 'DD'))

    return (
        <a href={`/blog/${post.id}`} className='flex items-center gap-3'>
            <div className='size-16 shrink-0 overflow-hidden rounded-xl bg-slate-100'>
                {post.image_url && <img src={post.image_url} alt='' className='size-full object-cover' />}
            </div>
            <span className='flex min-w-0 flex-1 flex-col gap-1'>
                <span className='text-sm leading-normal font-medium text-slate-900'>{post.title}</span>
                <span className='text-xs text-slate-400'>{`${month}月${day}日`}</span>
            </span>
        </a>
    )
}
