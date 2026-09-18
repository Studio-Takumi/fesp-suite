'use client'

import { useEffect } from 'react'

import { zodResolver } from '@hookform/resolvers/zod'
import { useQuery } from '@tanstack/react-query'
import { Controller, useForm } from 'react-hook-form'

import { type ProductListProps, productListPropsSchema } from '@fesp/schema'

import { shopProductsQuery } from '~/lib/queries'

import { IdListCheckboxes } from './fields/IdListCheckboxes'

export type ProductListPropsFormProps = {
    defaultValues: ProductListProps
    /** 入力が props の条件に合うときだけ呼ぶ */
    onValidChange: (props: ProductListProps) => void
}

/**
 * 商品一覧（`productList`）の props のフォーム。選ぶたびに検証し、合っていればブロックに反映する。
 * 表示する商品は、商品の一覧（仮データ）からチェックボックスで選ぶ。1つも選ばなければ全件出す
 */
export function ProductListPropsForm({ defaultValues, onValidChange }: ProductListPropsFormProps) {
    const products = useQuery(shopProductsQuery())
    const { control, watch } = useForm<ProductListProps>({
        resolver: zodResolver(productListPropsSchema),
        mode: 'onChange',
        defaultValues,
    })

    useEffect(() => {
        const subscription = watch((values) => {
            const result = productListPropsSchema.safeParse(values)
            if (result.success) onValidChange(result.data)
        })
        return () => subscription.unsubscribe()
    }, [watch, onValidChange])

    return (
        <Controller
            control={control}
            name='products'
            render={({ field }) => (
                <IdListCheckboxes
                    legend='表示する商品'
                    options={products.data ?? []}
                    value={field.value}
                    onChange={field.onChange}
                    idPrefix='product-list'
                />
            )}
        />
    )
}
