import { dateFormatter } from '@fesp/ui'

import type { BlogPost } from '~/lib/mock/blog'

export type BlogCardProps = {
    post: BlogPost
}

/** ブログ一覧の1枚（デザインの BlogCard）。上からサムネイル・日付と投稿者・タイトル・抜粋・タグ */
export function BlogCard({ post }: BlogCardProps) {
    // デザインは「6月2日」とゼロ埋めしないので、ゼロ埋めした値を数値に戻す
    const month = Number(dateFormatter(post.published_at, 'MM'))
    const day = Number(dateFormatter(post.published_at, 'DD'))

    return (
        <a href={`/blogs/${post.id}`} className='flex flex-col gap-3'>
            <div className='aspect-video overflow-hidden rounded-2xl bg-slate-100'>
                {post.image_url && <img src={post.image_url} alt='' className='size-full object-cover' />}
            </div>
            <div className='flex flex-col gap-2'>
                <div className='flex items-center gap-2 text-xs'>
                    <span className='text-slate-400'>{`${month}月${day}日`}</span>
                    <span className='text-slate-300' aria-hidden>
                        ・
                    </span>
                    <span className='text-slate-400'>{post.author}</span>
                </div>
                <span className='text-lg leading-normal font-bold text-slate-900'>{post.title}</span>
                <span className='text-sm leading-relaxed text-slate-500'>{post.excerpt}</span>
                {post.tags.length > 0 && (
                    <span className='flex flex-wrap gap-2'>
                        {post.tags.map((tag) => (
                            <span key={tag.id} className='rounded-full bg-sky-50 px-2 py-1 text-xs text-sky-500'>
                                #{tag.name}
                            </span>
                        ))}
                    </span>
                )}
            </div>
        </a>
    )
}
