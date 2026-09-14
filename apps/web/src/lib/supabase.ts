import { createClient } from '@supabase/supabase-js'

import { env } from './env'

/**
 * JWT（access / refresh）の保存と自動リフレッシュは supabase-js が行う。
 * 自前でトークンを保持しないこと。
 */
export const supabase = createClient(env.VITE_SUPABASE_URL, env.VITE_SUPABASE_ANON_KEY, {
    // 保存先のキーを固定し、E2E からログイン済みのセッションを入れられるようにする（e2e/support/session.ts）
    auth: { storageKey: 'fesp-web-auth' },
})
