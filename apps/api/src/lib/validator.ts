import { z } from 'zod'

import { badRequest } from './errors'

/**
 * zValidator の第3引数に渡す共通フック。
 * バリデーション失敗を API 共通のエラーフォーマット（errorResponseSchema）に揃える。
 *
 *   zValidator("json", exampleInputSchema, validationHook)
 */
export function validationHook<T>(result: { success: true } | { success: false; error: z.core.$ZodError<T> }): void {
    if (result.success) return
    const { fieldErrors } = z.flattenError(result.error as z.ZodError<T>)
    throw badRequest('入力値が不正です', fieldErrors as Record<string, string[]>)
}
