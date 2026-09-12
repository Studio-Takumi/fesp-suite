import { QueryClient } from '@tanstack/react-query'

import { ApiError } from '@fesp/types'

export function createQueryClient(): QueryClient {
    return new QueryClient({
        defaultOptions: {
            queries: {
                // 情報発信系はオフラインキャッシュ前提なので長めに保持する
                staleTime: 60 * 1000,
                gcTime: 24 * 60 * 60 * 1000,
                retry: (failureCount, error) => {
                    // 4xx はリトライしない
                    if (error instanceof ApiError && error.status < 500) return false
                    return failureCount < 2
                },
                refetchOnWindowFocus: false,
            },
        },
    })
}
