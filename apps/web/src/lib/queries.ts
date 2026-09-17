import { queryOptions } from '@tanstack/react-query'

import { articleViewResponseSchema, exampleResponseSchema } from '@fesp/schema'

import { apiFetch } from './api'
import { mapMock } from './mock/map'
import { mockAdjacentPosts, mockCurrentPost, mockNewsPosts, mockNewsTags } from './mock/news'
import { createMockWeather } from './mock/weather'

/**
 * サーバー状態は必ずここ（TanStack Query）で扱う。
 * Zustand にサーバー状態を入れないこと。
 *
 * 実装を始めるときは、機能ごとに queryOptions を足していく。
 */
export const queryKeys = {
    example: ['example'] as const,
    article: (id: string) => ['articles', id] as const,
    map: ['map'] as const,
    news: ['news'] as const,
    newsTags: ['news', 'tags'] as const,
    currentPost: ['posts', 'current'] as const,
    adjacentPosts: ['posts', 'current', 'adjacent'] as const,
    weather: ['weather'] as const,
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

/** マップ（独自コンポーネント `map`）のフロアと場所の一覧。本物の API ができるまでは仮データを返す */
export const mapQuery = () =>
    queryOptions({
        queryKey: queryKeys.map,
        queryFn: () => Promise.resolve(mapMock),
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

/**
 * 天気（今日・週間予報・警報・暑さ指数・概況・更新時刻）。天気の独自コンポーネントはどれもこれを読む。
 * 天気の API ができるまでは仮データ（`lib/mock/weather.ts`）を返す
 */
export const weatherQuery = () =>
    queryOptions({
        queryKey: queryKeys.weather,
        queryFn: () => Promise.resolve(createMockWeather()),
    })
