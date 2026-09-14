import { z } from 'zod'

import { timestampSchema, uuidSchema } from './common'

/** ユーザー（`GET /api/me` のレスポンス） */
export const userResponseSchema = z.object({
    id: uuidSchema,
    created_at: timestampSchema,
    updated_at: timestampSchema,
})
export type UserResponse = z.infer<typeof userResponseSchema>
