import { z } from 'zod'

/** UUID */
export const uuidSchema = z.uuid({ message: 'IDの形式が正しくありません' })

/** ISO8601 タイムスタンプ（timestamptz） */
export const timestampSchema = z.iso.datetime({
    offset: true,
    message: '日時の形式が正しくありません',
})

/** ISO8601 日付（YYYY-MM-DD） */
export const dateSchema = z.iso.date({ message: '日付の形式が正しくありません' })

/** URL */
export const urlSchema = z.url({ message: 'URLの形式が正しくありません' })

/** 対象のイベントを指定するクエリ。イベントに属するものの一覧で使う */
export const eventQuerySchema = z.object({
    event_id: uuidSchema,
})
export type EventQuery = z.infer<typeof eventQuerySchema>

/** `:id` のパスパラメータ */
export const idParamSchema = z.object({
    id: uuidSchema,
})

/** 一覧APIの共通クエリ */
export const paginationQuerySchema = z.object({
    limit: z.coerce.number().int().min(1).max(100).default(20),
    offset: z.coerce.number().int().min(0).default(0),
})
export type PaginationQuery = z.infer<typeof paginationQuerySchema>

/** エラーレスポンス（API共通フォーマット） */
export const errorResponseSchema = z.object({
    error: z.object({
        code: z.string(),
        message: z.string(),
        /** zod の flatten 結果など、フィールド単位の詳細 */
        details: z.record(z.string(), z.array(z.string())).optional(),
    }),
})
export type ErrorResponse = z.infer<typeof errorResponseSchema>
