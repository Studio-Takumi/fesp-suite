import { useState } from 'react'

import { useQueryClient } from '@tanstack/react-query'
import { useNavigate } from '@tanstack/react-router'
import { LogOut } from 'lucide-react'

import { supabase } from '~/lib/supabase'

/** 設定（`/settings`）。いまはログアウトボタンだけの仮ページ */
export function SettingsPage() {
    const navigate = useNavigate()
    const queryClient = useQueryClient()
    const [isSigningOut, setIsSigningOut] = useState(false)

    const signOut = async () => {
        setIsSigningOut(true)
        // global にすると他の端末・管理者サイトのログインまで切れるので、この端末のセッションだけ終える
        await supabase.auth.signOut({ scope: 'local' })
        queryClient.clear()
        await navigate({ to: '/login' })
    }

    return (
        <div className='space-y-6'>
            <h1 className='text-2xl font-bold'>設定</h1>
            <button
                type='button'
                onClick={() => void signOut()}
                disabled={isSigningOut}
                className='flex h-11 items-center gap-2 rounded-lg border border-slate-200 px-4 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50'
            >
                <LogOut size={16} aria-hidden />
                ログアウト
            </button>
        </div>
    )
}
