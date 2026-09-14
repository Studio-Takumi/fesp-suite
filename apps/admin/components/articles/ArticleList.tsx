'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'

import { useQuery } from '@tanstack/react-query'

import { Button } from '~/components/ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '~/components/ui/table'
import { articlesQuery, useCreateArticle } from '~/lib/queries'

const dateTimeFormat = new Intl.DateTimeFormat('ja-JP', {
    dateStyle: 'medium',
    timeStyle: 'short',
    timeZone: 'Asia/Tokyo',
})

export function ArticleList() {
    const router = useRouter()
    const articles = useQuery(articlesQuery())
    const createArticle = useCreateArticle()

    const handleCreate = () => {
        createArticle.mutate({ content: [] }, { onSuccess: (article) => router.push(`/articles/${article.id}`) })
    }

    return (
        <div className='space-y-6 p-8'>
            <div className='flex items-center justify-between'>
                <h1 className='text-2xl font-bold'>記事一覧</h1>
                <Button onClick={handleCreate} disabled={createArticle.isPending}>
                    新規作成
                </Button>
            </div>

            {createArticle.isError ? (
                <p role='alert' className='text-sm text-destructive'>
                    {createArticle.error.message}
                </p>
            ) : null}

            {articles.isPending ? (
                <p className='text-sm text-muted-foreground'>読み込み中…</p>
            ) : articles.isError ? (
                <p role='alert' className='text-sm text-destructive'>
                    {articles.error.message}
                </p>
            ) : articles.data.items.length === 0 ? (
                <p className='text-sm text-muted-foreground'>記事がありません</p>
            ) : (
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>記事ID</TableHead>
                            <TableHead>更新日時</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {articles.data.items.map((article) => (
                            <TableRow key={article.id}>
                                <TableCell>
                                    <Link href={`/articles/${article.id}`} className='font-mono underline'>
                                        {article.id}
                                    </Link>
                                </TableCell>
                                <TableCell>{dateTimeFormat.format(new Date(article.updated_at))}</TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            )}
        </div>
    )
}
