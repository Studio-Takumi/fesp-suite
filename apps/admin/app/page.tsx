'use client'

import { useState } from 'react'

import { useQuery } from '@tanstack/react-query'
import type { ColumnDef } from '@tanstack/react-table'

import { DataTable } from '~/components/example/data-table'
import { ExampleForm } from '~/components/example/example-form'
import { exampleQuery, useCreateExample } from '~/lib/queries'

/**
 * 配線確認用のページ。
 * TanStack Query / TanStack Table / React Hook Form + 共有zod が
 * 繋がっていることを確認できる。実装時はこのページを置き換える。
 */
type SampleRow = { id: string; name: string; status: string }

const sampleRows: SampleRow[] = [
    { id: '1', name: 'サンプルA', status: '下書き' },
    { id: '2', name: 'サンプルB', status: '公開' },
    { id: '3', name: 'サンプルC', status: '公開' },
]

const columns: ColumnDef<SampleRow>[] = [
    { accessorKey: 'name', header: '名前' },
    { accessorKey: 'status', header: '状態' },
]

export default function AdminHomePage() {
    const example = useQuery(exampleQuery())
    const createExample = useCreateExample()
    const [submitted, setSubmitted] = useState<string | null>(null)

    return (
        <main className='mx-auto max-w-4xl space-y-8 p-8'>
            <header className='space-y-1'>
                <h1 className='text-2xl font-bold'>管理者ページ</h1>
                <p className='text-sm text-muted-foreground'>
                    セットアップ確認用の画面です。実装時にこのページを置き換えてください。
                </p>
            </header>

            <section className='space-y-3 rounded-lg border border-border p-6'>
                <h2 className='font-semibold'>API との疎通（TanStack Query）</h2>
                {example.isPending ? (
                    <p className='text-muted-foreground'>読み込み中…</p>
                ) : example.error ? (
                    <p role='alert' className='text-destructive'>
                        APIに接続できませんでした（`bun run dev --filter @fesp/api` を起動してください）
                    </p>
                ) : (
                    <p>{example.data.message}</p>
                )}
            </section>

            <section className='space-y-3 rounded-lg border border-border p-6'>
                <h2 className='font-semibold'>フォーム（React Hook Form + 共有zod）</h2>
                <ExampleForm
                    onSubmit={async (values) => {
                        await createExample.mutateAsync(values).catch(() => null)
                        setSubmitted(values.name)
                    }}
                />
                {submitted ? <p className='text-sm text-muted-foreground'>送信しました: {submitted}</p> : null}
            </section>

            <section className='space-y-3 rounded-lg border border-border p-6'>
                <h2 className='font-semibold'>一覧（TanStack Table）</h2>
                <DataTable data={sampleRows} columns={columns} filterLabel='名前で絞り込み' />
            </section>
        </main>
    )
}
