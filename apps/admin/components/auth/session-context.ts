'use client'

import { createContext, useContext } from 'react'

import type { Session } from '@supabase/supabase-js'

export const SessionContext = createContext<Session | null>(null)

/** ログイン中のセッション。`AuthGuard` の外では `null` */
export function useSession() {
    return useContext(SessionContext)
}
