'use client'

import { useEffect } from 'react'

import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'

import { type CoverImageProps, coverImagePropsSchema } from '@fesp/schema'

import { Input } from '~/components/ui/input'
import { Label } from '~/components/ui/label'

export type CoverImagePropsFormProps = {
    defaultValues: CoverImageProps
    /** 入力が props の条件に合うときだけ呼ぶ */
    onValidChange: (props: CoverImageProps) => void
}

/** 記事の画像（`coverImage`）の props のフォーム。入力するたびに検証し、合っていればブロックに反映する */
export function CoverImagePropsForm({ defaultValues, onValidChange }: CoverImagePropsFormProps) {
    const {
        register,
        watch,
        formState: { errors },
    } = useForm<CoverImageProps>({
        resolver: zodResolver(coverImagePropsSchema),
        mode: 'onChange',
        defaultValues,
    })

    useEffect(() => {
        const subscription = watch((values) => {
            const result = coverImagePropsSchema.safeParse(values)
            if (result.success) onValidChange(result.data)
        })
        return () => subscription.unsubscribe()
    }, [watch, onValidChange])

    return (
        <div className='space-y-2'>
            <Label htmlFor='cover-image-url'>画像の URL</Label>
            <Input
                id='cover-image-url'
                type='url'
                placeholder='https://example.com/image.jpg'
                aria-invalid={errors.imageUrl ? true : undefined}
                aria-describedby={errors.imageUrl ? 'cover-image-url-error' : undefined}
                {...register('imageUrl')}
            />
            {errors.imageUrl && (
                <p id='cover-image-url-error' role='alert' className='text-sm text-destructive'>
                    {errors.imageUrl.message}
                </p>
            )}
        </div>
    )
}
