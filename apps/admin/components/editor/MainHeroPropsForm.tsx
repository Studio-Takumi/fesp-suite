'use client'

import { useEffect } from 'react'

import { zodResolver } from '@hookform/resolvers/zod'
import { useFieldArray, useForm } from 'react-hook-form'

import {
    formatMainHeroSlides,
    type MainHeroProps,
    type MainHeroSlides,
    mainHeroSlidesSchema,
    parseMainHeroSlides,
} from '@fesp/schema'

import { Button } from '~/components/ui/button'
import { Input } from '~/components/ui/input'
import { Label } from '~/components/ui/label'

export type MainHeroPropsFormProps = {
    defaultValues: MainHeroProps
    /** 入力が props の条件に合うときだけ呼ぶ */
    onValidChange: (props: MainHeroProps) => void
}

/** スライドを足したときの初期値 */
const emptySlide = { imageUrl: '', catchphrase: '', title: '' }

/**
 * メインスライダー（`mainHero`）の props のフォーム。入力するたびに検証し、合っていればブロックに反映する。
 * props の `slides`（1行1枚の文字列）はフォームではスライドの配列として扱い、反映するときに文字列に戻す
 */
export function MainHeroPropsForm({ defaultValues, onValidChange }: MainHeroPropsFormProps) {
    const {
        control,
        register,
        watch,
        formState: { errors },
    } = useForm<MainHeroSlides>({
        resolver: zodResolver(mainHeroSlidesSchema),
        mode: 'onChange',
        defaultValues: { slides: parseMainHeroSlides(defaultValues.slides) },
    })
    const { fields, append, remove } = useFieldArray({ control, name: 'slides' })

    useEffect(() => {
        const subscription = watch((values) => {
            const result = mainHeroSlidesSchema.safeParse(values)
            if (result.success) onValidChange({ slides: formatMainHeroSlides(result.data.slides) })
        })
        return () => subscription.unsubscribe()
    }, [watch, onValidChange])

    return (
        <div className='space-y-4'>
            {fields.map((field, index) => (
                <fieldset key={field.id} className='space-y-2 rounded-md border border-border p-3'>
                    <legend className='px-1 text-sm font-medium'>{index + 1}枚目</legend>
                    <div className='space-y-2'>
                        <Label htmlFor={`main-hero-image-url-${index}`}>画像の URL</Label>
                        <Input
                            id={`main-hero-image-url-${index}`}
                            type='url'
                            placeholder='https://example.com/hero.jpg'
                            aria-invalid={errors.slides?.[index]?.imageUrl ? true : undefined}
                            {...register(`slides.${index}.imageUrl`)}
                        />
                        {errors.slides?.[index]?.imageUrl && (
                            <p role='alert' className='text-sm text-destructive'>
                                {errors.slides[index].imageUrl.message}
                            </p>
                        )}
                    </div>
                    <div className='space-y-2'>
                        <Label htmlFor={`main-hero-catchphrase-${index}`}>キャッチ</Label>
                        <Input
                            id={`main-hero-catchphrase-${index}`}
                            aria-invalid={errors.slides?.[index]?.catchphrase ? true : undefined}
                            {...register(`slides.${index}.catchphrase`)}
                        />
                        {errors.slides?.[index]?.catchphrase && (
                            <p role='alert' className='text-sm text-destructive'>
                                {errors.slides[index].catchphrase.message}
                            </p>
                        )}
                    </div>
                    <div className='space-y-2'>
                        <Label htmlFor={`main-hero-title-${index}`}>タイトル</Label>
                        <Input
                            id={`main-hero-title-${index}`}
                            aria-invalid={errors.slides?.[index]?.title ? true : undefined}
                            {...register(`slides.${index}.title`)}
                        />
                        {errors.slides?.[index]?.title && (
                            <p role='alert' className='text-sm text-destructive'>
                                {errors.slides[index].title.message}
                            </p>
                        )}
                    </div>
                    <Button type='button' variant='outline' size='sm' onClick={() => remove(index)}>
                        削除
                    </Button>
                </fieldset>
            ))}
            <Button type='button' variant='outline' size='sm' onClick={() => append(emptySlide)}>
                スライドを追加
            </Button>
        </div>
    )
}
