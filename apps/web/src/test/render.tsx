import type { ReactElement } from 'react'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { createMemoryHistory, createRouter, RouterContextProvider, RouterProvider } from '@tanstack/react-router'
import { render } from '@testing-library/react'

import { routeTree } from '~/router'

/** 実際のルートツリーをメモリ履歴で描画する（ページ単位のテスト用） */
export function renderApp(initialPath = '/') {
    const queryClient = createTestQueryClient()

    const router = createRouter({
        routeTree,
        history: createMemoryHistory({ initialEntries: [initialPath] }),
    })

    const utils = render(
        <QueryClientProvider client={queryClient}>
            <RouterProvider router={router} />
        </QueryClientProvider>,
    )

    return { ...utils, router, queryClient }
}

/** テスト用の QueryClient。リトライせず、キャッシュを残さない */
export function createTestQueryClient() {
    return new QueryClient({
        defaultOptions: { queries: { retry: false, gcTime: 0 } },
    })
}

/**
 * Router の中で描画する（`<Link>` を使うコンポーネント単位のテスト用）。
 * ルートは解決するだけで描画には使わないので、`RouterContextProvider` で渡した `ui` をそのまま出す
 * （`RouterProvider` は最初の読み込みが非同期で、同期に書かれたテストが待てないため）
 */
export function renderInRouter(ui: ReactElement, queryClient = createTestQueryClient()) {
    const router = createRouter({ routeTree, history: createMemoryHistory({ initialEntries: ['/'] }) })

    const utils = render(
        <QueryClientProvider client={queryClient}>
            <RouterContextProvider router={router}>{ui}</RouterContextProvider>
        </QueryClientProvider>,
    )

    return { ...utils, router, queryClient }
}

/** QueryClient だけを入れて描画する（データを読むコンポーネント単位のテスト用） */
export function renderWithQueryClient(ui: ReactElement, queryClient = createTestQueryClient()) {
    const utils = render(<QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>)

    return { ...utils, queryClient }
}
