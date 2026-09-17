import { useQuery } from '@tanstack/react-query'
import { UserRound } from 'lucide-react'

import { dateFormatter } from '@fesp/ui'

import { QueryBoundary } from '~/components/QueryBoundary'
import { currentPostQuery } from '~/lib/queries'

import type { BlockComponentProps } from '../block-registry'

/** 記事のサマリー（独自コンポーネント `postSummary`）。表示中の記事の作成者・更新日時・タグ */
export function PostSummary({ children }: BlockComponentProps) {
    const post = useQuery(currentPostQuery())

    return (
        <>
            <QueryBoundary isPending={post.isPending} error={post.error} data={post.data}>
                {(data) => {
                    // デザインは「2026年6月6日」とゼロ埋めしないので、ゼロ埋めした値を数値に戻す
                    const updatedAt = `${dateFormatter(data.updated_at, 'YYYY')}年${Number(dateFormatter(data.updated_at, 'MM'))}月${Number(dateFormatter(data.updated_at, 'DD'))}日 ${dateFormatter(data.updated_at, 'HH:mm')}`

                    return (
                        <div className='flex flex-col gap-3 border-b border-slate-200 pb-4'>
                            <div className='flex items-center gap-3'>
                                <div className='flex size-9 shrink-0 items-center justify-center rounded-full bg-sky-100'>
                                    <UserRound size={18} className='text-sky-500' aria-hidden />
                                </div>
                                <div className='flex min-w-0 flex-col'>
                                    <span className='text-sm font-medium text-slate-900'>{data.author}</span>
                                    <span className='text-xs text-slate-500'>
                                        <time dateTime={data.updated_at}>{updatedAt}</time> 更新
                                    </span>
                                </div>
                            </div>
                            {data.tags.length > 0 && (
                                <div className='flex flex-wrap gap-3 text-xs text-sky-500'>
                                    {data.tags.map((tag) => (
                                        <span key={tag.id}>#{tag.name}</span>
                                    ))}
                                </div>
                            )}
                        </div>
                    )
                }}
            </QueryBoundary>
            {children}
        </>
    )
}
