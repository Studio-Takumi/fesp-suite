import { createClient, type SupabaseClient } from '@supabase/supabase-js'

import type { Database } from '@fesp/types'

import type { Bindings } from '../types'

/**
 * ユーザーの JWT をそのまま引き継いだクライアント。
 * RLS がユーザー権限で効くため、原則こちらを使う（推奨・安全）。
 */
export function createUserClient(env: Bindings, accessToken: string): SupabaseClient<Database> {
    return createClient<Database>(env.SUPABASE_URL, env.SUPABASE_ANON_KEY, {
        global: { headers: { Authorization: `Bearer ${accessToken}` } },
        auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
    })
}

/** 匿名クライアント。公開データを RLS の公開読み取りポリシーに従って読む用。 */
export function createAnonClient(env: Bindings): SupabaseClient<Database> {
    return createClient<Database>(env.SUPABASE_URL, env.SUPABASE_ANON_KEY, {
        auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
    })
}

/**
 * service_role クライアント。RLS を貫通するため、
 * **呼び出し側で必ず認可チェックを済ませてから**使うこと。
 */
export function createServiceClient(env: Bindings): SupabaseClient<Database> {
    if (!env.SUPABASE_SERVICE_ROLE_KEY) {
        throw new Error('SUPABASE_SERVICE_ROLE_KEY が設定されていません')
    }
    return createClient<Database>(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
        auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
    })
}
