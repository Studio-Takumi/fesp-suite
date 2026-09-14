import type { Metadata } from 'next'
import { Suspense } from 'react'

import { AuthForm } from '~/components/auth/AuthForm'

export const metadata: Metadata = { title: '新規登録' }

export default function SignupPage() {
    // AuthForm が useSearchParams を使うため Suspense で包む
    return (
        <Suspense>
            <AuthForm mode='signup' />
        </Suspense>
    )
}
