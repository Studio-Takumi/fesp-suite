'use client'

import { queryOptions, useMutation, useQueryClient } from '@tanstack/react-query'
import { z } from 'zod'

import {
    type ArticleInput,
    articleListResponseSchema,
    articleResponseSchema,
    type ExampleInput,
    exampleInputSchema,
    exampleResponseSchema,
} from '@fesp/schema'

import { adminFetch } from './api'
import { env } from './env'

/**
 * サーバー状態は TanStack Query が担当する。
 * 実装を始めるときは、機能ごとに queryOptions / useMutation を足していく。
 */
export const queryKeys = {
    example: ['example'] as const,
    articles: ['articles'] as const,
    article: (id: string) => ['articles', id] as const,
}

export const exampleQuery = () =>
    queryOptions({
        queryKey: queryKeys.example,
        queryFn: ({ signal }) => adminFetch('/api/example', exampleResponseSchema, { signal }),
    })

const exampleCreatedSchema = z.object({ received: exampleInputSchema })

export function useCreateExample() {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: (input: ExampleInput) =>
            adminFetch('/api/example', exampleCreatedSchema, { method: 'POST', body: input }),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.example }),
    })
}

const eventQuery = () => `event_id=${env.NEXT_PUBLIC_EVENT_ID}`

export const articlesQuery = () =>
    queryOptions({
        queryKey: queryKeys.articles,
        queryFn: ({ signal }) =>
            adminFetch(`/api/articles?${eventQuery()}&limit=100`, articleListResponseSchema, { signal }),
    })

export const articleQuery = (id: string) =>
    queryOptions({
        queryKey: queryKeys.article(id),
        queryFn: ({ signal }) => adminFetch(`/api/articles/${id}?${eventQuery()}`, articleResponseSchema, { signal }),
    })

export function useCreateArticle() {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: (input: ArticleInput) =>
            adminFetch(`/api/articles?${eventQuery()}`, articleResponseSchema, { method: 'POST', body: input }),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.articles, exact: true }),
    })
}

export function useUpdateArticle(id: string) {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: (input: ArticleInput) =>
            adminFetch(`/api/articles/${id}?${eventQuery()}`, articleResponseSchema, { method: 'PUT', body: input }),
        onSuccess: (article) => {
            queryClient.setQueryData(queryKeys.article(id), article)
            return queryClient.invalidateQueries({ queryKey: queryKeys.articles, exact: true })
        },
    })
}
