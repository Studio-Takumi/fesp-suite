import { createRootRoute, createRoute, createRouter } from '@tanstack/react-router'

import { AppShell } from './components/app-shell'
import { ArticlePage } from './pages/ArticlePage'
import { HomePage } from './pages/home'

/**
 * URL 状態は Router が担当する（ページ・フィルタ・検索クエリ）。
 * ファイルベースではなくコード定義にして、生成ファイルへの依存を持たない構成にしている。
 * 画面を足すときは createRoute を追加して routeTree に並べる。
 */
const rootRoute = createRootRoute({
    component: AppShell,
})

const indexRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: '/',
    component: HomePage,
})

const articleRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: '/articles/$articleId',
    component: ArticlePage,
})

export const routeTree = rootRoute.addChildren([indexRoute, articleRoute])

export function createAppRouter() {
    return createRouter({ routeTree, defaultPreload: 'intent' })
}

export const router = createAppRouter()

declare module '@tanstack/react-router' {
    interface Register {
        router: typeof router
    }
}
