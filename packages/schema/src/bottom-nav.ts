import { z } from 'zod'

import { uuidSchema } from './common'

/**
 * lucide のアイコン名。`Bell` `CalendarDays` のような PascalCase で持つ。
 *
 * 取りうる値を列挙しない（lucide のアイコンならどれでも選べる）。このパッケージは API（Workers）からも
 * 読むので、lucide-react に依存させず**形だけ**を検証する。実在するかどうかは描画側で受け止める
 * （ウェブアプリは知らない名前のアイコンを出さずに、ラベルと移動先はそのまま出す）
 */
export const lucideIconNameSchema = z
    .string()
    .min(1, { message: 'アイコンを選んでください' })
    .max(40, { message: 'アイコン名は40文字までです' })
    .regex(/^[A-Z][A-Za-z0-9]*$/, { message: 'アイコン名の形式が正しくありません' })

/** 下のナビの項目（`GET /api/bottom-navs` の items の1件） */
export const bottomNavSchema = z.object({
    id: uuidSchema,
    label: z.string(),
    icon: z.string(),
    href: z.string(),
    sort_order: z.number().int(),
})
export type BottomNav = z.infer<typeof bottomNavSchema>

/** GET /api/bottom-navs のレスポンス */
export const bottomNavListResponseSchema = z.object({
    items: z.array(bottomNavSchema),
})
export type BottomNavListResponse = z.infer<typeof bottomNavListResponseSchema>

/** 置き換えで渡す1項目。`sort_order` は渡さず、配列の順がそのまま並び順になる */
export const bottomNavItemInputSchema = z.object({
    label: z.string().min(1, { message: '名前を入力してください' }).max(10, { message: '名前は10文字までです' }),
    icon: lucideIconNameSchema,
    href: z
        .string()
        .min(1, { message: '移動先を入力してください' })
        .max(100, { message: '移動先は100文字までです' })
        .regex(/^\//, { message: '移動先は / で始まるパスで入力してください' }),
})
export type BottomNavItemInput = z.infer<typeof bottomNavItemInputSchema>

/** ナビの項目数の上限。デザインは4つだが、5つまで置ける */
export const BOTTOM_NAV_MAX_ITEMS = 5

/**
 * PUT /api/bottom-navs のリクエストボディ。
 * 1件ずつ作り消しせず、置き換え後の全部を配列で渡す（空配列なら全部消す）
 */
export const bottomNavsInputSchema = z.object({
    event_id: uuidSchema,
    items: z
        .array(bottomNavItemInputSchema)
        .max(BOTTOM_NAV_MAX_ITEMS, { message: `項目は${BOTTOM_NAV_MAX_ITEMS}件までです` }),
})
export type BottomNavsInput = z.infer<typeof bottomNavsInputSchema>
