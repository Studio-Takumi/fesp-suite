import { useSearch } from '@tanstack/react-router'

import { AuthForm } from '~/components/auth/AuthForm'

/** 新規登録（`/signup`） */
export function SignupPage() {
    const { redirect } = useSearch({ from: '/signup' })

    return <AuthForm mode='signup' redirect={redirect} />
}
