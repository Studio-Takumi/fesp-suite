import { HTTPException } from 'hono/http-exception'
import type { ContentfulStatusCode } from 'hono/utils/http-status'

import type { ErrorResponse } from '@fesp/schema'

/** API エラーを共通フォーマット（errorResponseSchema）で投げる */
export function apiError(
    status: ContentfulStatusCode,
    code: string,
    message: string,
    details?: Record<string, string[]>,
): HTTPException {
    const body: ErrorResponse = { error: { code, message, ...(details ? { details } : {}) } }
    return new HTTPException(status, {
        res: Response.json(body, { status }),
    })
}

export const unauthorized = (message = '認証が必要です') => apiError(401, 'unauthorized', message)

export const forbidden = (message = 'この操作を行う権限がありません') => apiError(403, 'forbidden', message)

export const notFound = (message = '対象が見つかりません') => apiError(404, 'not_found', message)

export const conflict = (message: string) => apiError(409, 'conflict', message)

export const badRequest = (message: string, details?: Record<string, string[]>) =>
    apiError(400, 'bad_request', message, details)
