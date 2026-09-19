import type { ReactNode } from 'react'

import { Outlet, useChildMatches } from '@tanstack/react-router'

import { ArticleBySlug } from '~/components/article/ArticleBySlug'
import { tabletMediaQuery, useMediaQuery } from '~/lib/use-media-query'

type ListDetailPanesProps = {
    /** 一覧側に出す記事の slug（`news` など） */
    slug: string
    /** 個別を開いていないときに右のペインへ出すもの（一覧の先頭の記事） */
    detail: ReactNode
}

/**
 * 一覧（左）と個別（右）の2ペイン（docs/app.md）。
 * 幅が足りないときは、個別を開いていれば個別だけ、開いていなければ一覧だけを出す。
 * 左右は独立してスクロールするので、`AppShell` が `md` 以上で高さを決めている前提で `h-full` を取る
 */
export function ListDetailPanes({ slug, detail }: ListDetailPanesProps) {
    const isTablet = useMediaQuery(tabletMediaQuery)
    // 個別のルート（`/news/$postId` など）が当たっているか
    const hasDetail = useChildMatches().length > 0
    const list = <ArticleBySlug slug={slug} />

    if (!isTablet) return hasDetail ? <Outlet /> : list

    return (
        <div className='flex h-full'>
            <div className='w-90 shrink-0 overflow-y-auto border-r border-slate-200 pr-4'>{list}</div>
            <div className='flex-1 overflow-y-auto pl-6'>{hasDetail ? <Outlet /> : detail}</div>
        </div>
    )
}
