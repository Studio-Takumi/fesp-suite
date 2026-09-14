import { useSearch } from '@tanstack/react-router'

import { AuthForm } from '~/components/auth/AuthForm'

/** ログイン（`/login`） */
export function LoginPage() {
    const { redirect } = useSearch({ from: '/login' })

    return <AuthForm mode='login' redirect={redirect} />
}
