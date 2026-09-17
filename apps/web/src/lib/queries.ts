import { queryOptions } from '@tanstack/react-query'

import { articleViewResponseSchema, exampleResponseSchema } from '@fesp/schema'

import { apiFetch } from './api'
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

/**
 * 天気（今日・週間予報・警報・暑さ指数・概況・更新時刻）。天気の独自コンポーネントはどれもこれを読む。
 * 天気の API ができるまでは仮データ（`lib/mock/weather.ts`）を返す
 */
export const weatherQuery = () =>
    queryOptions({
        queryKey: queryKeys.weather,
        queryFn: () => Promise.resolve(createMockWeather()),
    })
