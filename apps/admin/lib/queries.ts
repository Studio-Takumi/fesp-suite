'use client'

import { queryOptions, useMutation, useQueryClient } from '@tanstack/react-query'
import { z } from 'zod'

import {
    type ArticleCreateInput,
    type ArticleInput,
    articleListResponseSchema,
    articleResponseSchema,
    type EventDay,
    type EventDayInput,
    eventDayListResponseSchema,
    type ExampleInput,
    exampleInputSchema,
    exampleResponseSchema,
    type Place,
    type PlaceInput,
    placeListResponseSchema,
    type Tag,
    type TagInput,
    tagListResponseSchema,
} from '@fesp/schema'

import { adminFetch } from './api'
import { env } from './env'
import { mockArtistTags } from './mock/artist'
import { mockBlogTags } from './mock/blog'
import { mockNewsTags } from './mock/news'
import { mockShopProducts, mockShopTags } from './mock/shop'

/**
 * サーバー状態は TanStack Query が担当する。
 * 実装を始めるときは、機能ごとに queryOptions / useMutation を足していく。
 */
export const queryKeys = {
    example: ['example'] as const,
    articles: ['articles'] as const,
    article: (id: string) => ['articles', id] as const,
    newsTags: ['news', 'tags'] as const,
    artistTags: ['artists', 'tags'] as const,
    shopTags: ['shops', 'tags'] as const,
    shopProducts: ['shops', 'current', 'products'] as const,
    blogTags: ['blogs', 'tags'] as const,
    eventDays: ['event-days'] as const,
    places: ['places'] as const,
    tags: ['tags'] as const,
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

/** お知らせのタグ。API ができるまで仮データ（lib/mock/news.ts）を返す。API ができたら queryFn を差し替える（#56） */
export const newsTagsQuery = () =>
    queryOptions({
        queryKey: queryKeys.newsTags,
        queryFn: () => Promise.resolve(mockNewsTags),
    })

/** ブログのタグ。API ができるまで仮データ（lib/mock/blog.ts）を返す。API ができたら queryFn を差し替える（#57） */
export const blogTagsQuery = () =>
    queryOptions({
        queryKey: queryKeys.blogTags,
        queryFn: () => Promise.resolve(mockBlogTags),
    })

/** 模擬店のタグ。API ができるまで仮データ（lib/mock/shop.ts）を返す。API ができたら queryFn を差し替える（#59） */
export const shopTagsQuery = () =>
    queryOptions({
        queryKey: queryKeys.shopTags,
        queryFn: () => Promise.resolve(mockShopTags),
    })

/** 表示中の模擬店の商品。API ができるまで仮データ（lib/mock/shop.ts）を返す。API ができたら queryFn を差し替える（#59） */
export const shopProductsQuery = () =>
    queryOptions({
        queryKey: queryKeys.shopProducts,
        queryFn: () => Promise.resolve(mockShopProducts),
    })

/** 出演者のタグ。API ができるまで仮データ（lib/mock/artist.ts）を返す。API ができたら queryFn を差し替える（#60） */
export const artistTagsQuery = () =>
    queryOptions({
        queryKey: queryKeys.artistTags,
        queryFn: () => Promise.resolve(mockArtistTags),
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

/** 保存の入力。`publish_at` を入れると予約、`null` にすると予約の取り消しになる */
export type SaveArticleInput = ArticleInput & {
    publish_at: string | null
}

export function useSaveArticle(id: string) {
    const queryClient = useQueryClient()

    return useMutation({
        // 保存 → 予約（または予約の取り消し）の順に呼ぶ。docs/admin.md の「記事エディタ」
        mutationFn: async ({ publish_at, ...input }: SaveArticleInput) => {
            const saved = await adminFetch(`/api/articles/${id}`, articleResponseSchema, {
                method: 'PUT',
                body: input,
                authenticated: true,
            })

            if (publish_at) {
                // 版の更新日時も送り、保存のあとに版が上書きされていたら API が 409 で断る
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
            }

            // 公開中の版が変わると予約は DB のトリガーで消えるので、残っているときだけ取り消す
            if (!saved.schedule) return saved

            return adminFetch(`/api/articles/${id}/schedule`, articleResponseSchema, {
                method: 'DELETE',
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

/**
 * 開催日・場所・タグの読み書き。3つとも「イベントに属する行を1件ずつ作る・直す・消す」で
 * API の形が同じなので、queryOptions とミューテーションをまとめて作る。
 *
 * 行を直した時点で保存するので、成功したら一覧を読み直す（docs/admin.md）
 */
function createEventResourceQueries<Item extends { id: string }, Input>(
    path: string,
    queryKey: readonly string[],
    listSchema: z.ZodType<{ items: Item[] }>,
) {
    const list = () =>
        queryOptions({
            queryKey,
            queryFn: ({ signal }) =>
                adminFetch(`${path}?event_id=${env.NEXT_PUBLIC_EVENT_ID}`, listSchema, {
                    signal,
                    authenticated: true,
                }),
        })

    /** 作成・更新・削除で共通の後片付け。一覧を読み直す */
    const useInvalidate = () => {
        const queryClient = useQueryClient()
        return () => queryClient.invalidateQueries({ queryKey, exact: true })
    }

    const useCreate = () => {
        const invalidate = useInvalidate()
        return useMutation({
            mutationFn: (input: Input) =>
                adminFetch(path, z.custom<Item>(), {
                    method: 'POST',
                    body: { ...input, event_id: env.NEXT_PUBLIC_EVENT_ID },
                    authenticated: true,
                }),
            onSuccess: invalidate,
        })
    }

    const useUpdate = () => {
        const invalidate = useInvalidate()
        return useMutation({
            mutationFn: ({ id, ...input }: Input & { id: string }) =>
                adminFetch(`${path}/${id}`, z.custom<Item>(), { method: 'PUT', body: input, authenticated: true }),
            onSuccess: invalidate,
        })
    }

    const useDelete = () => {
        const invalidate = useInvalidate()
        return useMutation({
            mutationFn: (id: string) =>
                adminFetch(`${path}/${id}`, z.void(), { method: 'DELETE', authenticated: true }),
            onSuccess: invalidate,
        })
    }

    return { list, useCreate, useUpdate, useDelete }
}

/** 開催日（`/schedule/event-days`） */
export const eventDayQueries = createEventResourceQueries<EventDay, EventDayInput>(
    '/api/event-days',
    queryKeys.eventDays,
    eventDayListResponseSchema,
)

/** 場所（`/map/places`） */
export const placeQueries = createEventResourceQueries<Place, PlaceInput>(
    '/api/places',
    queryKeys.places,
    placeListResponseSchema,
)

/** タグ（`/news/tags`） */
export const tagQueries = createEventResourceQueries<Tag, TagInput>('/api/tags', queryKeys.tags, tagListResponseSchema)
