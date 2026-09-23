import { z } from 'zod'

import { dateSchema, timestampSchema, uuidSchema } from './common'

/** 日の表示名（`前夜祭` など）。空文字は `null` として扱う */
export const eventDayNameSchema = z
    .string()
    .max(30, { message: '表示名は30文字までです' })
    .nullable()
    .transform((value) => (value === '' ? null : value))

/** 何日目か。イベントごとに 1 から1ずつ増える */
export const eventDayNumberSchema = z.number().int().min(1, { message: '1以上の整数を指定してください' })

/** 開催日（`GET /api/event-days` の items の1件） */
export const eventDaySchema = z.object({
    id: uuidSchema,
    event_id: uuidSchema,
    day: eventDayNumberSchema,
    date: dateSchema,
    name: z.string().nullable(),
    created_at: timestampSchema,
    updated_at: timestampSchema,
})
export type EventDay = z.infer<typeof eventDaySchema>

/** GET /api/event-days のレスポンス。件数が少ないので limit / offset は持たない */
export const eventDayListResponseSchema = z.object({
    items: z.array(eventDaySchema),
})
export type EventDayListResponse = z.infer<typeof eventDayListResponseSchema>

/** PUT /api/event-days/:id のリクエストボディ。開催日のイベントは変えられないので `event_id` を持たない */
export const eventDayInputSchema = z.object({
    day: eventDayNumberSchema,
    date: dateSchema,
    name: eventDayNameSchema.optional().default(null),
})
export type EventDayInput = z.infer<typeof eventDayInputSchema>

/** POST /api/event-days のリクエストボディ */
export const eventDayCreateInputSchema = eventDayInputSchema.extend({ event_id: uuidSchema })
export type EventDayCreateInput = z.infer<typeof eventDayCreateInputSchema>
