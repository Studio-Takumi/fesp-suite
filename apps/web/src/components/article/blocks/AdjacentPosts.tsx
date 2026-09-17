import { useQuery } from '@tanstack/react-query'
import { ChevronLeft, ChevronRight } from 'lucide-react'

import { cn } from '@fesp/ui'

import { QueryBoundary } from '~/components/QueryBoundary'
import type { NewsPost } from '~/lib/mock/news'
import { adjacentPostsQuery } from '~/lib/queries'

import type { BlockComponentProps } from '../block-registry'

/** 前後の記事（独自コンポーネント `adjacentPosts`）。前の記事（1つ古い）・次の記事（1つ新しい）へのリンク */
export function AdjacentPosts({ children }: BlockComponentProps) {
    const adjacent = useQuery(adjacentPostsQuery())

    return (
        <>
            <QueryBoundary isPending={adjacent.isPending} error={adjacent.error} data={adjacent.data}>
                {({ previous, next }) =>
                    (previous || next) && (
                        <nav aria-label='前後の記事' className='flex flex-col border-t border-slate-200 pt-3'>
                            {previous && <AdjacentPostLink direction='previous' post={previous} />}
                            {next && <AdjacentPostLink direction='next' post={next} />}
                        </nav>
                    )
                }
            </QueryBoundary>
            {children}
        </>
    )
}

type AdjacentPostLinkProps = {
    direction: 'previous' | 'next'
    post: Pick<NewsPost, 'id' | 'title'>
}

function AdjacentPostLink({ direction, post }: AdjacentPostLinkProps) {
    const isPrevious = direction === 'previous'
    const Arrow = isPrevious ? ChevronLeft : ChevronRight

    return (
        <a
            href={`/news/${post.id}`}
            className={cn('flex items-center gap-3 py-3', isPrevious ? 'text-left' : 'flex-row-reverse text-right')}
        >
            <Arrow size={18} className='shrink-0 text-slate-400' aria-hidden />
            <span className='flex min-w-0 flex-1 flex-col gap-1'>
                <span className='text-xs text-slate-400'>{isPrevious ? '前の記事' : '次の記事'}</span>
                <span className='text-sm font-medium text-slate-900'>{post.title}</span>
            </span>
        </a>
    )
}
