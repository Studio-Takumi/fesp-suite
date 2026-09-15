'use client'

import { queryOptions, useMutation, useQueryClient } from '@tanstack/react-query'
import { z } from 'zod'

import {
    type ArticleCreateInput,
    type ArticleInput,
    articleListResponseSchema,
    articleResponseSchema,
    type ArticleScheduleInput,
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

// 対象のイベントは、イベントを切り替えられるようになるまで env で固定する
export const articlesQuery = () =>
    queryOptions({
        queryKey: queryKeys.articles,
        queryFn: ({ signal }) =>
            adminFetch(`/api/articles?event_id=${env.NEXT_PUBLIC_EVENT_ID}&limit=100`, articleListResponseSchema, {
                signal,
                authenticated: true,
            }),
    })

export const articleQuery = (id: string) =>
    queryOptions({
        queryKey: queryKeys.article(id),
        queryFn: ({ signal }) =>
            adminFetch(`/api/articles/${id}`, articleResponseSchema, { signal, authenticated: true }),
    })

export function useCreateArticle() {
    const queryClient = useQueryClient()

    return useMutation({
        // 記事は下書きで作るので、作成の入力は公開状態を持たない
        mutationFn: (input: Omit<ArticleCreateInput, 'event_id'>) =>
            adminFetch('/api/articles', articleResponseSchema, {
                method: 'POST',
                body: { ...input, event_id: env.NEXT_PUBLIC_EVENT_ID },
                authenticated: true,
            }),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.articles, exact: true }),
    })
}

export function useUpdateArticle(id: string) {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: (input: ArticleInput) =>
            adminFetch(`/api/articles/${id}`, articleResponseSchema, {
                method: 'PUT',
                body: input,
                authenticated: true,
            }),
        onSuccess: (article) => {
            queryClient.setQueryData(queryKeys.article(id), article)
            return queryClient.invalidateQueries({ queryKey: queryKeys.articles, exact: true })
        },
    })
}

/** 予約するときの入力。今のタイトル・本文と、公開する日時 */
export type ScheduleArticleInput = Pick<ArticleInput, 'title' | 'content'> & Pick<ArticleScheduleInput, 'publish_at'>

export function useScheduleArticle(id: string) {
    const queryClient = useQueryClient()

    return useMutation({
        // 今の中身を保存してから（status を送らないので、公開中の記事なら一時保存）、保存した最新の版を予約する。
        // 版の更新日時も送り、そのあとの保存で版が上書きされていたら API が 409 で断る
        mutationFn: async ({ title, content, publish_at }: ScheduleArticleInput) => {
            const saved = await adminFetch(`/api/articles/${id}`, articleResponseSchema, {
                method: 'PUT',
                body: { title, content },
                authenticated: true,
            })
            if (!saved.latest_history) throw new Error('保存した版が読み込めませんでした')

            return adminFetch(`/api/articles/${id}/schedule`, articleResponseSchema, {
                method: 'PUT',
                body: {
                    version: saved.latest_history.version,
                    version_updated_at: saved.latest_history.updated_at,
                    publish_at,
                },
                authenticated: true,
            })
        },
        onSuccess: (article) => queryClient.setQueryData(queryKeys.article(id), article),
        // 保存だけ成功して予約に失敗したときも最新の記事にするため、成否にかかわらず読み直す
        onSettled: () =>
            Promise.all([
                queryClient.invalidateQueries({ queryKey: queryKeys.article(id), exact: true }),
                queryClient.invalidateQueries({ queryKey: queryKeys.articles, exact: true }),
            ]),
    })
}

export function useCancelArticleSchedule(id: string) {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: () =>
            adminFetch(`/api/articles/${id}/schedule`, articleResponseSchema, {
                method: 'DELETE',
                authenticated: true,
            }),
        onSuccess: (article) => {
            queryClient.setQueryData(queryKeys.article(id), article)
            return queryClient.invalidateQueries({ queryKey: queryKeys.articles, exact: true })
        },
    })
}
