import { z } from 'zod'

import { timestampSchema, uuidSchema } from './common'

/** 空文字を `null` として扱う任意の文字列 */
const optionalTextSchema = (max: number, label: string) =>
    z
        .string()
        .max(max, { message: `${label}は${max}文字までです` })
        .nullable()
        .transform((value) => (value === '' ? null : value))

/** 並び順。小さいものから出す */
export const sortOrderSchema = z.number().int().min(0, { message: '0以上の整数を指定してください' })

/** 場所（`GET /api/places` の items の1件） */
export const placeSchema = z.object({
    id: uuidSchema,
    event_id: uuidSchema,
    name: z.string(),
    building: z.string().nullable(),
    floor: z.string().nullable(),
    sort_order: sortOrderSchema,
    created_at: timestampSchema,
    updated_at: timestampSchema,
})
export type Place = z.infer<typeof placeSchema>

/** GET /api/places のレスポンス。件数が少ないので limit / offset は持たない */
export const placeListResponseSchema = z.object({
    items: z.array(placeSchema),
})
export type PlaceListResponse = z.infer<typeof placeListResponseSchema>

/** PUT /api/places/:id のリクエストボディ。場所のイベントは変えられないので `event_id` を持たない */
export const placeInputSchema = z.object({
    name: z
        .string()
        .min(1, { message: '場所の名前を入力してください' })
        .max(50, { message: '場所の名前は50文字までです' }),
    building: optionalTextSchema(30, '建物').optional().default(null),
    floor: optionalTextSchema(10, '階').optional().default(null),
    sort_order: sortOrderSchema.optional().default(0),
})
export type PlaceInput = z.infer<typeof placeInputSchema>

/** POST /api/places のリクエストボディ */
export const placeCreateInputSchema = placeInputSchema.extend({ event_id: uuidSchema })
export type PlaceCreateInput = z.infer<typeof placeCreateInputSchema>
