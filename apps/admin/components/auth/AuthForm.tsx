'use client'

import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { useEffect, useState } from 'react'

import { zodResolver } from '@hookform/resolvers/zod'
import { Eye, EyeOff, Globe, Lock, Mail } from 'lucide-react'
import { useForm } from 'react-hook-form'

import { redirectPathSchema, type SignInInput, signInSchema, signUpSchema } from '@fesp/schema'

import { supabase } from '~/lib/supabase'
import { cn } from '~/lib/utils'

type AuthFormProps = {
    mode: 'login' | 'signup'
}

const TEXT = {
    login: {
        title: '管理画面にログイン',
        description: '実行委員会のメンバーとして登録されたメールアドレスでログインしてください。',
        google: 'Google でログイン',
        submit: 'ログイン',
        switchLead: 'アカウントをお持ちでない方は',
        switchLabel: '新規登録',
        switchHref: '/signup',
    },
    signup: {
        title: '新規登録',
        description: 'メールアドレスとパスワードを入力して、アカウントを作成してください。',
        google: 'Google で登録',
        submit: '登録する',
        switchLead: 'アカウントをお持ちの方は',
        switchLabel: 'ログイン',
        switchHref: '/login',
    },
} as const

const FALLBACK_ERROR = '時間をおいて再度お試しください'

/** Supabase Auth のエラーコードを画面の文言にする */
function toErrorMessage(code: string | undefined) {
    switch (code) {
        case 'invalid_credentials':
            return 'メールアドレスまたはパスワードが違います'
        case 'user_already_exists':
        case 'email_exists':
            return 'このメールアドレスは登録済みです'
        default:
            return FALLBACK_ERROR
    }
}

/** ログイン・新規登録のフォーム（Google とメールアドレス + パスワード） */
export function AuthForm({ mode }: AuthFormProps) {
    const router = useRouter()
    const searchParams = useSearchParams()
    const text = TEXT[mode]
    const redirect = searchParams.get('redirect')
    const redirectPath = redirectPathSchema.parse(redirect)
    const [isPasswordVisible, setIsPasswordVisible] = useState(false)
    const [formError, setFormError] = useState<string | null>(null)

    const {
        register,
        handleSubmit,
        formState: { errors, isSubmitting },
    } = useForm<SignInInput>({
        resolver: zodResolver(mode === 'login' ? signInSchema : signUpSchema),
        defaultValues: { email: '', password: '' },
    })

    // ログイン済みで開いたら、すぐに redirect のパスへ移動する
    useEffect(() => {
        void supabase.auth.getSession().then(({ data }) => {
            if (data.session) router.replace(redirectPath)
        })
    }, [router, redirectPath])

    const onSubmit = async (input: SignInInput) => {
        setFormError(null)
        const { data, error } =
            mode === 'login' ? await supabase.auth.signInWithPassword(input) : await supabase.auth.signUp(input)
        if (error || !data.session) {
            setFormError(toErrorMessage(error?.code))
            return
        }
        router.replace(redirectPath)
    }

    const signInWithGoogle = async () => {
        setFormError(null)
        const { error } = await supabase.auth.signInWithOAuth({
            provider: 'google',
            options: { redirectTo: `${window.location.origin}${redirectPath}` },
        })
        if (error) setFormError(FALLBACK_ERROR)
    }

    const switchHref =
        redirect === null ? text.switchHref : `${text.switchHref}?redirect=${encodeURIComponent(redirect)}`

    return (
        <div className='flex min-h-screen items-center justify-center bg-slate-50 p-14'>
            <div className='w-full max-w-sm space-y-5 rounded-2xl border border-slate-200 bg-white p-9'>
                <div className='flex items-center gap-2'>
                    <span className='flex size-9 items-center justify-center rounded-lg bg-sky-500 text-lg font-bold text-white'>
                        F
                    </span>
                    <span className='text-lg font-semibold text-slate-900'>fesp</span>
                </div>

                <div className='space-y-2'>
                    <h1 className='text-2xl font-bold text-slate-900'>{text.title}</h1>
                    <p className='text-xs leading-relaxed text-slate-500'>{text.description}</p>
                </div>

                <button
                    type='button'
                    onClick={() => void signInWithGoogle()}
                    className='flex h-11 w-full items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white text-sm font-medium text-slate-700 hover:bg-slate-50'
                >
                    <Globe size={16} aria-hidden />
                    {text.google}
                </button>

                <div className='flex items-center gap-3 text-xs text-slate-400'>
                    <span className='h-px flex-1 bg-slate-200' />
                    または
                    <span className='h-px flex-1 bg-slate-200' />
                </div>

                <form noValidate onSubmit={(event) => void handleSubmit(onSubmit)(event)} className='space-y-5'>
                    <div className='space-y-2'>
                        <label htmlFor='email' className='text-xs font-medium text-slate-700'>
                            メールアドレス
                        </label>
                        <div
                            className={cn(
                                'flex h-11 items-center gap-2 rounded-lg border px-3 focus-within:border-sky-500',
                                errors.email ? 'border-rose-500' : 'border-slate-200',
                            )}
                        >
                            <Mail size={16} className='shrink-0 text-slate-400' aria-hidden />
                            <input
                                id='email'
                                type='email'
                                autoComplete='email'
                                aria-invalid={Boolean(errors.email)}
                                aria-describedby={errors.email ? 'email-error' : undefined}
                                className='min-w-0 flex-1 bg-transparent text-sm text-slate-900 outline-none'
                                {...register('email')}
                            />
                        </div>
                        {errors.email ? (
                            <p id='email-error' className='text-xs text-rose-500'>
                                {errors.email.message}
                            </p>
                        ) : null}
                    </div>

                    <div className='space-y-2'>
                        <label htmlFor='password' className='text-xs font-medium text-slate-700'>
                            パスワード
                        </label>
                        <div
                            className={cn(
                                'flex h-11 items-center gap-2 rounded-lg border px-3 focus-within:border-sky-500',
                                errors.password ? 'border-rose-500' : 'border-slate-200',
                            )}
                        >
                            <Lock size={16} className='shrink-0 text-slate-400' aria-hidden />
                            <input
                                id='password'
                                type={isPasswordVisible ? 'text' : 'password'}
                                autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                                aria-invalid={Boolean(errors.password)}
                                aria-describedby='password-note'
                                className='min-w-0 flex-1 bg-transparent text-sm text-slate-900 outline-none'
                                {...register('password')}
                            />
                            <button
                                type='button'
                                onClick={() => setIsPasswordVisible((visible) => !visible)}
                                aria-label={isPasswordVisible ? 'パスワードを隠す' : 'パスワードを表示'}
                                className='shrink-0 text-slate-400 hover:text-slate-700'
                            >
                                {isPasswordVisible ? <EyeOff size={16} /> : <Eye size={16} />}
                            </button>
                        </div>
                        {errors.password ? (
                            <p id='password-note' className='text-xs text-rose-500'>
                                {errors.password.message}
                            </p>
                        ) : mode === 'signup' ? (
                            <p id='password-note' className='text-xs text-slate-400'>
                                8文字以上で入力してください
                            </p>
                        ) : null}
                    </div>

                    {formError ? (
                        <p role='alert' className='text-sm text-rose-500'>
                            {formError}
                        </p>
                    ) : null}

                    <button
                        type='submit'
                        disabled={isSubmitting}
                        className='h-11 w-full rounded-lg bg-sky-500 text-sm font-semibold text-white hover:bg-sky-600 disabled:opacity-50'
                    >
                        {text.submit}
                    </button>
                </form>

                <p className='text-center text-xs text-slate-500'>
                    {text.switchLead}{' '}
                    <Link href={switchHref} className='font-semibold text-sky-500'>
                        {text.switchLabel}
                    </Link>
                </p>
            </div>
        </div>
    )
}
