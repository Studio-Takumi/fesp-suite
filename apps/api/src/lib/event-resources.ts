import type { SupabaseClient } from '@supabase/supabase-js'
import type { HTTPException } from 'hono/http-exception'

import type { Database } from '@fesp/types'

import { forbidden, notFound } from './errors'

/** 開催日・場所・タグ。どれも同じイベントに属し、同じ RLS（読めるのはメンバー、書けるのは staff）を持つ */
export type EventResourceTable = 'event_days' | 'places' | 'tags'

type UserClient = SupabaseClient<Database>

/**
 * 更新・削除が0件だったときに投げるエラーを決める。`throw await writeFailure(...)` の形で使う。
 *
 * RLS では staff でない行は更新・削除だけができない（読むのはメンバーなら通る）ので、
 * 書けなかった行がそのユーザーに読めるかどうかで分かる。
 * 読めれば「メンバーだが staff でない」の 403、読めなければ「無い・別のイベントのもの」の 404。
 */
export async function writeFailure(
    supabase: UserClient,
    table: EventResourceTable,
    id: string,
    forbiddenMessage: string,
): Promise<HTTPException> {
    const { data, error } = await supabase.from(table).select('id').eq('id', id).maybeSingle()
    if (error) throw error
    return data ? forbidden(forbiddenMessage) : notFound('対象が見つかりません')
}
