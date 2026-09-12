'use client'

import { type ReactNode, useState } from 'react'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

import { ApiError } from '@fesp/types'

export function Providers({ children }: { children: ReactNode }) {
    // SSR とクライアントで QueryClient を共有しないよう state に持つ
    const [queryClient] = useState(
        () =>
            new QueryClient({
                defaultOptions: {
                    queries: {
                        staleTime: 30 * 1000,
                        retry: (failureCount, error) =>
                            error instanceof ApiError && error.status < 500 ? false : failureCount < 2,
                        refetchOnWindowFocus: false,
                    },
                },
            }),
    )

    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
}
