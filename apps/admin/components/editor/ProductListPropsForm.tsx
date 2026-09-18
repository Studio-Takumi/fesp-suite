'use client'

import { useEffect } from 'react'

import { zodResolver } from '@hookform/resolvers/zod'
import { useQuery } from '@tanstack/react-query'
import { Controller, useForm } from 'react-hook-form'

import { parseProductListIds, type ProductListProps, productListPropsSchema } from '@fesp/schema'

import { Checkbox } from '~/components/ui/checkbox'
import { Label } from '~/components/ui/label'
import { shopProductsQuery } from '~/lib/queries'

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
        <fieldset className='space-y-2'>
            <legend className='text-sm font-medium'>表示する商品</legend>
            <Controller
                control={control}
                name='products'
                render={({ field }) => {
                    const selected = parseProductListIds(field.value)
                    // 並びは商品の一覧の順にそろえる
                    const toggle = (id: string, checked: boolean) =>
                        field.onChange(
                            (products.data ?? [])
                                .map((product) => product.id)
                                .filter((productId) => (productId === id ? checked : selected.includes(productId)))
                                .join(','),
                        )

                    return (
                        <div className='space-y-2'>
                            {(products.data ?? []).map((product) => (
                                <div key={product.id} className='flex items-center gap-2'>
                                    <Checkbox
                                        id={`product-list-${product.id}`}
                                        checked={selected.includes(product.id)}
                                        onCheckedChange={(checked) => toggle(product.id, checked === true)}
                                    />
                                    <Label htmlFor={`product-list-${product.id}`} className='font-normal'>
                                        {product.name}
                                    </Label>
                                </div>
                            ))}
                        </div>
                    )
                }}
            />
        </fieldset>
    )
}
