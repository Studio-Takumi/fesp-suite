import { z } from 'zod'

import { timestampSchema, uuidSchema } from './common'
import { sortOrderSchema } from './place'

/** タグ（`GET /api/tags` の items の1件） */
export const tagSchema = z.object({
    id: uuidSchema,
    event_id: uuidSchema,
    name: z.string(),
    sort_order: sortOrderSchema,
    created_at: timestampSchema,
    updated_at: timestampSchema,
})
export type Tag = z.infer<typeof tagSchema>

/** GET /api/tags のレスポンス。件数が少ないので limit / offset は持たない */
export const tagListResponseSchema = z.object({
    items: z.array(tagSchema),
})
export type TagListResponse = z.infer<typeof tagListResponseSchema>

/** PUT /api/tags/:id のリクエストボディ。タグのイベントは変えられないので `event_id` を持たない */
export const tagInputSchema = z.object({
    name: z
        .string()
        .min(1, { message: 'タグの名前を入力してください' })
        .max(20, { message: 'タグの名前は20文字までです' }),
    sort_order: sortOrderSchema.optional().default(0),
})
export type TagInput = z.infer<typeof tagInputSchema>

/** POST /api/tags のリクエストボディ */
export const tagCreateInputSchema = tagInputSchema.extend({ event_id: uuidSchema })
export type TagCreateInput = z.infer<typeof tagCreateInputSchema>

/**
 * PUT /api/articles/:id/tags のリクエストボディ。
 * 1件ずつ足し引きせず、置き換え後の全部を配列で渡す（空配列なら全部外す）
 */
export const articleTagsInputSchema = z.object({
    tag_ids: z
        .array(uuidSchema)
        .refine((ids) => new Set(ids).size === ids.length, { message: '同じタグが2つ以上入っています' }),
})
export type ArticleTagsInput = z.infer<typeof articleTagsInputSchema>
