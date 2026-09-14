import type { Metadata } from 'next'
import { Suspense } from 'react'

import { AuthForm } from '~/components/auth/AuthForm'

export const metadata: Metadata = { title: 'ログイン' }

export default function LoginPage() {
    // AuthForm が useSearchParams を使うため Suspense で包む
    return (
        <Suspense>
            <AuthForm mode='login' />
        </Suspense>
    )
}
