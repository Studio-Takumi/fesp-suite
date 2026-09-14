'use client'

import { useRouter } from 'next/navigation'
import { type ReactNode, useEffect, useState } from 'react'

import type { Session } from '@supabase/supabase-js'
import { useQueryClient } from '@tanstack/react-query'

import { supabase } from '~/lib/supabase'

import { SessionContext } from './session-context'

/**
 * ログインが要るページを包む。ログインしているかを確かめ終わるまでは何も出さない。
 * 未ログインなら開こうとしたパスを持って `/login` へ、ログアウトしたら `/login` へ移動する。
 */
export function AuthGuard({ children }: { children: ReactNode }) {
    const router = useRouter()
    const queryClient = useQueryClient()
    const [session, setSession] = useState<Session | null>(null)

    useEffect(() => {
        // 購読した直後に INITIAL_SESSION が届くので、最初の確認もここで済む
        const {
            data: { subscription },
        } = supabase.auth.onAuthStateChange((event, nextSession) => {
            if (nextSession) {
                setSession(nextSession)
                return
            }

            setSession(null)
            if (event === 'SIGNED_OUT') {
                queryClient.clear()
                router.replace('/login')
                return
            }
            const current = `${window.location.pathname}${window.location.search}`
            router.replace(`/login?redirect=${encodeURIComponent(current)}`)
        })

        return () => subscription.unsubscribe()
    }, [router, queryClient])

    if (!session) return null

    return <SessionContext.Provider value={session}>{children}</SessionContext.Provider>
}
