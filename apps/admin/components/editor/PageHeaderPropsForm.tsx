'use client'

import { useEffect } from 'react'

import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'

import { type PageHeaderProps, pageHeaderPropsSchema } from '@fesp/schema'

import { Input } from '~/components/ui/input'
import { Label } from '~/components/ui/label'

export type PageHeaderPropsFormProps = {
    defaultValues: PageHeaderProps
    /** 入力が props の条件に合うときだけ呼ぶ */
    onValidChange: (props: PageHeaderProps) => void
}

/** ページ見出し（`pageHeader`）の props のフォーム。入力するたびに検証し、合っていればブロックに反映する */
export function PageHeaderPropsForm({ defaultValues, onValidChange }: PageHeaderPropsFormProps) {
    const {
        register,
        watch,
        formState: { errors },
    } = useForm<PageHeaderProps>({
        resolver: zodResolver(pageHeaderPropsSchema),
        mode: 'onChange',
        defaultValues,
    })

    useEffect(() => {
        const subscription = watch((values) => {
            const result = pageHeaderPropsSchema.safeParse(values)
            if (result.success) onValidChange(result.data)
        })
        return () => subscription.unsubscribe()
    }, [watch, onValidChange])

    return (
        <div className='space-y-4'>
            <div className='space-y-2'>
                <Label htmlFor='page-header-label'>英語ラベル</Label>
                <Input
                    id='page-header-label'
                    placeholder='NEWS'
                    aria-invalid={errors.label ? true : undefined}
                    aria-describedby={errors.label ? 'page-header-label-error' : undefined}
                    {...register('label')}
                />
                {errors.label && (
                    <p id='page-header-label-error' role='alert' className='text-sm text-destructive'>
                        {errors.label.message}
                    </p>
                )}
            </div>
            <div className='space-y-2'>
                <Label htmlFor='page-header-title'>日本語タイトル</Label>
                <Input
                    id='page-header-title'
                    placeholder='お知らせ'
                    aria-invalid={errors.title ? true : undefined}
                    aria-describedby={errors.title ? 'page-header-title-error' : undefined}
                    {...register('title')}
                />
                {errors.title && (
                    <p id='page-header-title-error' role='alert' className='text-sm text-destructive'>
                        {errors.title.message}
                    </p>
                )}
            </div>
        </div>
    )
}
