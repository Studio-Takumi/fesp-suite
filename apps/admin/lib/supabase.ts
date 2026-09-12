'use client'

import { createClient } from '@supabase/supabase-js'

import { env } from './env'

/**
 * 管理画面は `use client` 主体なのでブラウザ用クライアントを1つ持つ。
 * JWT（access / refresh）の保存・自動リフレッシュは supabase-js に任せ、自前実装しない。
 *
 * NOTE: SSR でセッションを読む必要が出たら @supabase/ssr の createServerClient を追加する。
 */
export const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_ANON_KEY)
