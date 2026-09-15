import type { ReactNode } from 'react'

import { AlertTriangle } from 'lucide-react'

import { ApiError } from '@fesp/types'
import { EmptyState, Spinner } from '@fesp/ui'

type QueryBoundaryProps<T> = {
    isPending: boolean
    error: Error | null
    data: T | undefined
    children: (data: T) => ReactNode
}

/** 読み込み中 / エラー / 表示 の分岐をまとめる */
export function QueryBoundary<T>({ isPending, error, data, children }: QueryBoundaryProps<T>) {
    if (isPending) {
        return (
            <div className='flex justify-center py-12'>
                <Spinner aria-label='読み込み中' />
            </div>
        )
    }

    if (error) {
        return (
            <EmptyState
                icon={AlertTriangle}
                title='読み込みに失敗しました'
                description={
                    error instanceof ApiError && error.isNotFound
                        ? 'ページが見つかりませんでした'
                        : '時間をおいて再度お試しください'
                }
            />
        )
    }

    if (data === undefined) return null

    return <>{children(data)}</>
}
