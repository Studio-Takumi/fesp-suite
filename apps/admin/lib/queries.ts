'use client'

import { queryOptions, useMutation, useQueryClient } from '@tanstack/react-query'
import { z } from 'zod'

import { type ExampleInput, exampleInputSchema, exampleResponseSchema } from '@fesp/schema'

import { adminFetch } from './api'

/**
 * サーバー状態は TanStack Query が担当する。
 * 実装を始めるときは、機能ごとに queryOptions / useMutation を足していく。
 */
export const queryKeys = {
    example: ['example'] as const,
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
