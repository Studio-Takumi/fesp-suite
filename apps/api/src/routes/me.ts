import { Hono } from 'hono'

import type { UserResponse } from '@fesp/schema'

import { notFound } from '../lib/errors'
import { createUserClient } from '../lib/supabase'
import { requireAuth } from '../middleware/auth'
import type { AppEnv } from '../types'

// ユーザーの JWT を引き継いだクライアントで読むので、RLS で自分の行しか見えない
export const meRoute = new Hono<AppEnv>().get('/', requireAuth, async (c) => {
    const { data, error } = await createUserClient(c.env, c.get('accessToken'))
        .from('users')
        .select('id, created_at, updated_at')
        .eq('id', c.get('user').userId)
        .is('deleted_at', null)
        .maybeSingle()
    if (error) throw error
    if (!data) throw notFound('ユーザーが見つかりません')

    return c.json<UserResponse>(data)
})
