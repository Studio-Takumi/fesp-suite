import { queryOptions } from '@tanstack/react-query'

import { articleViewResponseSchema, exampleResponseSchema } from '@fesp/schema'

import { apiFetch } from './api'
import { mapMock } from './mock/map'

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
