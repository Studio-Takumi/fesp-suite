'use client'

import type { z } from 'zod'

import { errorResponseSchema } from '@fesp/schema'
import { ApiError } from '@fesp/types'

import { env } from './env'
import { supabase } from './supabase'

type FetchOptions = {
    method?: 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE'
    body?: unknown
    signal?: AbortSignal
    /** 認証が不要なエンドポイントを叩くときは false */
    authenticated?: boolean
}

/**
 * API クライアント。
 * TanStack Query の queryFn / mutationFn からのみ呼ぶこと。
 */
export async function adminFetch<T extends z.ZodType>(
    path: string,
    schema: T,
    { method = 'GET', body, signal, authenticated = false }: FetchOptions = {},
): Promise<z.output<T>> {
    const headers: Record<string, string> = {}

    if (authenticated) {
        const { data } = await supabase.auth.getSession()
        const token = data.session?.access_token
        if (!token) throw new ApiError(401, 'unauthorized', 'ログインが必要です')
        headers.Authorization = `Bearer ${token}`
    }

    if (body !== undefined) headers['Content-Type'] = 'application/json'

    const response = await fetch(`${env.NEXT_PUBLIC_API_URL}${path}`, {
        method,
        headers,
        signal,
        ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
    })

    if (!response.ok) {
        const parsed = errorResponseSchema.safeParse(await response.json().catch(() => null))
        if (parsed.success) {
            const { code, message, details } = parsed.data.error
            throw new ApiError(response.status, code, message, details)
        }
        throw new ApiError(response.status, 'unknown_error', '通信に失敗しました')
    }

    if (response.status === 204) return undefined as z.output<T>
    return schema.parse(await response.json()) as z.output<T>
}
