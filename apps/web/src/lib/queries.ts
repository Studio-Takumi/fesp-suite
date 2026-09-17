import { queryOptions } from '@tanstack/react-query'

import { articleViewResponseSchema, exampleResponseSchema } from '@fesp/schema'

import { apiFetch } from './api'
import { mockAdjacentPosts, mockCurrentPost, mockNewsPosts, mockNewsTags } from './mock/news'

/**
 * サーバー状態は必ずここ（TanStack Query）で扱う。
 * Zustand にサーバー状態を入れないこと。
 *
 * 実装を始めるときは、機能ごとに queryOptions を足していく。
 */
export const queryKeys = {
    example: ['example'] as const,
    article: (id: string) => ['articles', id] as const,
    news: ['news'] as const,
    newsTags: ['news', 'tags'] as const,
    currentPost: ['posts', 'current'] as const,
    adjacentPosts: ['posts', 'current', 'adjacent'] as const,
}

export const exampleQuery = () =>
    queryOptions({
        queryKey: queryKeys.example,
        queryFn: ({ signal }) => apiFetch('/api/example', exampleResponseSchema, { signal }),
    })

export const articleQuery = (id: string) =>
    queryOptions({
        queryKey: queryKeys.article(id),
        queryFn: ({ signal }) =>
            apiFetch(`/api/articles/${id}`, articleViewResponseSchema, { signal, authenticated: true }),
    })

// お知らせ（#13）は API ができるまで仮データ（lib/mock/news.ts）を返す。API ができたら queryFn を差し替える（#56）

/** お知らせ（新しい順） */
export const newsQuery = () =>
    queryOptions({
        queryKey: queryKeys.news,
        queryFn: () => Promise.resolve(mockNewsPosts),
    })

/** お知らせのタグ */
export const newsTagsQuery = () =>
    queryOptions({
        queryKey: queryKeys.newsTags,
        queryFn: () => Promise.resolve(mockNewsTags),
    })

/** 表示中の記事の作成者・日時・タグ */
export const currentPostQuery = () =>
    queryOptions({
        queryKey: queryKeys.currentPost,
        queryFn: () => Promise.resolve(mockCurrentPost),
    })

/** 表示中の記事の前の記事・次の記事 */
export const adjacentPostsQuery = () =>
    queryOptions({
        queryKey: queryKeys.adjacentPosts,
        queryFn: () => Promise.resolve(mockAdjacentPosts),
    })
