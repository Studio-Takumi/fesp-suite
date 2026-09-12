'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import type { z } from 'zod'

import { type ExampleInput, exampleInputSchema } from '@fesp/schema'

import { Button } from '~/components/ui/button'
import { Input } from '~/components/ui/input'
import { Label } from '~/components/ui/label'

/** zod の .default() があるため、フォームの入力型（input）と送信型（output）は別物になる */
type ExampleFormValues = z.input<typeof exampleInputSchema>

export type ExampleFormProps = {
    defaultValues?: Partial<ExampleFormValues>
    onSubmit: (values: ExampleInput) => void | Promise<void>
    submitLabel?: string
}

/**
 * React Hook Form + 共有zodスキーマ の配線確認用フォーム。
 *
 * バリデーションは @fesp/schema のスキーマをそのまま使うので、
 * フロントで通った値は API 側でも必ず通る。
 * 実装時はこのファイルを参考に、機能ごとのフォームを作る。
 */
export function ExampleForm({ defaultValues, onSubmit, submitLabel = '送信' }: ExampleFormProps) {
    const {
        register,
        handleSubmit,
        formState: { errors, isSubmitting },
    } = useForm<ExampleFormValues, unknown, ExampleInput>({
        resolver: zodResolver(exampleInputSchema),
        defaultValues: { name: '', email: '', ...defaultValues },
    })

    return (
        <form onSubmit={handleSubmit(onSubmit)} className='space-y-4' noValidate>
            <div className='space-y-1.5'>
                <Label htmlFor='name'>名前</Label>
                <Input
                    id='name'
                    {...register('name')}
                    aria-invalid={Boolean(errors.name)}
                    aria-describedby={errors.name ? 'name-error' : undefined}
                />
                {errors.name ? (
                    <p id='name-error' role='alert' className='text-sm text-destructive'>
                        {errors.name.message}
                    </p>
                ) : null}
            </div>

            <div className='space-y-1.5'>
                <Label htmlFor='email'>メールアドレス</Label>
                <Input
                    id='email'
                    type='email'
                    {...register('email')}
                    aria-invalid={Boolean(errors.email)}
                    aria-describedby={errors.email ? 'email-error' : undefined}
                />
                {errors.email ? (
                    <p id='email-error' role='alert' className='text-sm text-destructive'>
                        {errors.email.message}
                    </p>
                ) : null}
            </div>

            <Button type='submit' disabled={isSubmitting}>
                {isSubmitting ? '送信中…' : submitLabel}
            </Button>
        </form>
    )
}
