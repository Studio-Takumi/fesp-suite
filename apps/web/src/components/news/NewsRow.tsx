import { Link } from '@tanstack/react-router'

import { dateFormatter } from '@fesp/ui'

import type { NewsPost } from '~/lib/mock/news'

export type NewsRowProps = {
    post: NewsPost
}

/** お知らせ一覧の1行（デザインの NewsRow）。左に日付（月と日）、右に投稿者・タイトル・タグ */
export function NewsRow({ post }: NewsRowProps) {
    // デザインは「6月」「6」とゼロ埋めしないので、ゼロ埋めした値を数値に戻す
    const month = Number(dateFormatter(post.published_at, 'MM'))
    const day = Number(dateFormatter(post.published_at, 'DD'))

    return (
        <Link
            to='/news/$postId'
            params={{ postId: post.id }}
            className='flex gap-4'
            activeProps={{ className: 'rounded-xl bg-sky-50' }}
        >
            <div className='flex size-16 shrink-0 flex-col items-center justify-center rounded-xl bg-slate-50'>
                <span className='text-xs text-slate-500'>{month}月</span>
                <span className='font-en text-2xl leading-tight font-medium text-slate-900'>{day}</span>
            </div>
            <div className='flex min-w-0 flex-1 flex-col gap-1'>
                <span className='text-xs text-slate-400'>{post.author}</span>
                <span className='text-base leading-snug font-medium text-slate-900'>{post.title}</span>
                {post.tags.length > 0 && (
                    <span className='flex flex-wrap gap-2 text-xs text-sky-500'>
                        {post.tags.map((tag) => (
                            <span key={tag.id}>#{tag.name}</span>
                        ))}
                    </span>
                )}
            </div>
        </Link>
    )
}
