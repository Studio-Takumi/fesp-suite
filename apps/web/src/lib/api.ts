import type { z } from 'zod'

import { errorResponseSchema } from '@fesp/schema'
import { ApiError } from '@fesp/types'

import { env } from './env'
import { supabase } from './supabase'

type FetchOptions = {
    method?: 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE'
    body?: unknown
    signal?: AbortSignal
    /** 認証が要るエンドポイントを叩くときは true */
    authenticated?: boolean
}

/**
 * API 呼び出しの共通ラッパー。
 * - 認証が要る場合は supabase-js が保持するアクセストークンを Bearer で付与
 * - レスポンスは共有 zod スキーマで検証してから返す（フロント/APIの型ズレ検出）
 */
export async function apiFetch<T extends z.ZodType>(
    path: string,
    schema: T,
    { method = 'GET', body, signal, authenticated = false }: FetchOptions = {},
): Promise<z.output<T>> {
    const headers: Record<string, string> = {}

    if (body !== undefined) headers['Content-Type'] = 'application/json'

    if (authenticated) {
        const { data } = await supabase.auth.getSession()
        const token = data.session?.access_token
        if (token) headers.Authorization = `Bearer ${token}`
    }

    const response = await fetch(`${env.VITE_API_URL}${path}`, {
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
