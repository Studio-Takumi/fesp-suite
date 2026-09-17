'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'

import { useQuery } from '@tanstack/react-query'
import type { ColumnDef } from '@tanstack/react-table'

import type { ArticleListItem } from '@fesp/schema'
import { dateFormatter } from '@fesp/ui'

import { DataTable } from '~/components/data-table/DataTable'
import { Badge } from '~/components/ui/badge'
import { Button } from '~/components/ui/button'
import { Input } from '~/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '~/components/ui/select'
import { articlesQuery, useCreateArticle } from '~/lib/queries'

/** 一覧に出す公開状態。status と予約の有無の組み合わせで、並べ替えの昇順に並べてある */
const articleListStates = ['draft', 'scheduled', 'published_scheduled', 'published'] as const
type ArticleListState = (typeof articleListStates)[number]

/** 予約は、下書きなら公開の予約、公開中なら中身を差し替える予約 */
const articleListStateLabels: Record<ArticleListState, string> = {
    draft: '下書き',
    scheduled: '予約中',
    published_scheduled: '公開中（更新予約あり）',
    published: '公開中',
}

function stateOf(article: ArticleListItem): ArticleListState {
    if (article.status === 'draft') return article.schedule ? 'scheduled' : 'draft'
    return article.schedule ? 'published_scheduled' : 'published'
}

/** 公開状態のバッジの色 */
const articleListStateBadgeClassNames: Record<ArticleListState, string> = {
    draft: 'bg-muted text-muted-foreground',
    scheduled: 'bg-amber-100 text-amber-800',
    published_scheduled: 'bg-sky-100 text-sky-700',
    published: 'bg-emerald-100 text-emerald-700',
}

/** 公開状態のセレクトで「すべて」を表す値（Radix の Select は空文字を値にできない） */
const ALL_STATES = 'all'

const columns: ColumnDef<ArticleListItem>[] = [
    {
        id: 'title',
        accessorFn: (article) => article.title,
        header: 'タイトル',
        sortingFn: 'text',
        filterFn: 'includesString',
        cell: ({ row }) => (
            <Link href={`/articles/${row.original.id}`} className='underline'>
                {row.original.title || '（無題）'}
            </Link>
        ),
    },
    {
        id: 'state',
        accessorFn: stateOf,
        header: '公開状態',
        sortingFn: (a, b) =>
            articleListStates.indexOf(a.getValue<ArticleListState>('state')) -
            articleListStates.indexOf(b.getValue<ArticleListState>('state')),
        filterFn: 'equals',
        cell: ({ getValue }) => {
            const state = getValue<ArticleListState>()
            return <Badge className={articleListStateBadgeClassNames[state]}>{articleListStateLabels[state]}</Badge>
        },
    },
    {
        id: 'updated_at',
        accessorFn: (article) => new Date(article.updated_at),
        header: '更新日時',
        sortingFn: 'datetime',
        sortDescFirst: true,
        enableColumnFilter: false,
        cell: ({ row }) => dateFormatter(row.original.updated_at, 'YYYY/MM/DD HH:mm'),
    },
]

export function ArticleList() {
    const router = useRouter()
    const articles = useQuery(articlesQuery())
    const createArticle = useCreateArticle()

    const handleCreate = () => {
        createArticle.mutate(
            { title: '', content: [] },
            { onSuccess: (article) => router.push(`/articles/${article.id}`) },
        )
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
                <DataTable
                    data={articles.data.items}
                    columns={columns}
                    initialSorting={[{ id: 'updated_at', desc: true }]}
                    pageSize={50}
                    emptyMessage='条件に合う記事がありません'
                    toolbar={(table) => (
                        <>
                            <Input
                                type='search'
                                placeholder='タイトルで検索'
                                aria-label='タイトルで検索'
                                value={(table.getColumn('title')?.getFilterValue() as string | undefined) ?? ''}
                                onChange={(event) => table.getColumn('title')?.setFilterValue(event.target.value)}
                                className='max-w-xs'
                            />
                            <Select
                                value={(table.getColumn('state')?.getFilterValue() as string | undefined) ?? ALL_STATES}
                                onValueChange={(value) =>
                                    table.getColumn('state')?.setFilterValue(value === ALL_STATES ? undefined : value)
                                }
                            >
                                <SelectTrigger aria-label='公開状態で絞り込み'>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value={ALL_STATES}>すべて</SelectItem>
                                    {articleListStates.map((state) => (
                                        <SelectItem key={state} value={state}>
                                            {articleListStateLabels[state]}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </>
                    )}
                />
            )}
        </div>
    )
}
