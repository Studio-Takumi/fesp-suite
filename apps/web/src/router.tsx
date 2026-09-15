import { createRootRoute, createRoute, createRouter, Outlet, redirect } from '@tanstack/react-router'

import { redirectPathSchema } from '@fesp/schema'

import { AppShell } from './components/AppShell'
import { supabase } from './lib/supabase'
import { ArticlePage } from './pages/ArticlePage'
import { HomePage } from './pages/HomePage'
import { LoginPage } from './pages/LoginPage'
import { SettingsPage } from './pages/SettingsPage'
import { SignupPage } from './pages/SignupPage'

/**
 * URL 状態は Router が担当する（ページ・フィルタ・検索クエリ）。
 * ファイルベースではなくコード定義にして、生成ファイルへの依存を持たない構成にしている。
 * 画面を足すときは createRoute を追加して routeTree に並べる。
 * ログインが要るページは `authenticatedRoute` の子にする。
 */
const rootRoute = createRootRoute({
    component: Outlet,
})

async function hasSession() {
    const { data } = await supabase.auth.getSession()
    return data.session !== null
}

/** ログインが要るページの親（URL には出ない）。未ログインなら開こうとしたパスを持ってログインへ移動する */
const authenticatedRoute = createRoute({
    getParentRoute: () => rootRoute,
    id: '_authenticated',
    component: AppShell,
    beforeLoad: async ({ location }) => {
        if (!(await hasSession())) {
            throw redirect({ to: '/login', search: { redirect: location.href } })
        }
    },
})

const indexRoute = createRoute({
    getParentRoute: () => authenticatedRoute,
    path: '/',
    component: HomePage,
})

const articleRoute = createRoute({
    getParentRoute: () => authenticatedRoute,
    path: '/articles/$articleId',
    component: ArticlePage,
})

const settingsRoute = createRoute({
    getParentRoute: () => authenticatedRoute,
    path: '/settings',
    component: SettingsPage,
})

/** ログイン・新規登録の検索パラメータ。`redirect` の中身はログイン後に `redirectPathSchema` で確かめる */
export type AuthSearch = { redirect?: string }

function validateAuthSearch(search: Record<string, unknown>): AuthSearch {
    return typeof search.redirect === 'string' ? { redirect: search.redirect } : {}
}

/** ログイン済みでログイン・新規登録を開いたら、redirect のパスへ移動する */
async function redirectIfSignedIn({ search }: { search: AuthSearch }) {
    if (await hasSession()) {
        throw redirect({ href: redirectPathSchema.parse(search.redirect) })
    }
}

const loginRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: '/login',
    validateSearch: validateAuthSearch,
    beforeLoad: redirectIfSignedIn,
    component: LoginPage,
})

const signupRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: '/signup',
    validateSearch: validateAuthSearch,
    beforeLoad: redirectIfSignedIn,
    component: SignupPage,
})

export const routeTree = rootRoute.addChildren([
    authenticatedRoute.addChildren([indexRoute, articleRoute, settingsRoute]),
    loginRoute,
    signupRoute,
])

export function createAppRouter() {
    return createRouter({ routeTree, defaultPreload: 'intent' })
}

export const router = createAppRouter()

declare module '@tanstack/react-router' {
    interface Register {
        router: typeof router
    }
}
