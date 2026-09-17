'use client'

import { type ReactNode, useState } from 'react'

import {
    type ColumnDef,
    type ColumnFiltersState,
    flexRender,
    getCoreRowModel,
    getFilteredRowModel,
    getPaginationRowModel,
    getSortedRowModel,
    type SortingState,
    type Table as TanStackTable,
    useReactTable,
} from '@tanstack/react-table'
import { ArrowDown, ArrowUp, ArrowUpDown } from 'lucide-react'

import { Button } from '~/components/ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '~/components/ui/table'

export type DataTableProps<TData, TValue> = {
    data: TData[]
    columns: ColumnDef<TData, TValue>[]
    /** 最初の並び順。省略すると data の順のまま */
    initialSorting?: SortingState
    /** 1ページの行数 */
    pageSize?: number
    /** 絞り込んで0行になったときに表の中に出す文言 */
    emptyMessage?: string
    /** 表の上に出す部品（検索欄・セレクトなど）。`table.getColumn(id)?.setFilterValue()` で列を絞り込む */
    toolbar?: (table: TanStackTable<TData>) => ReactNode
}

/**
 * TanStack Table（ヘッドレス）で組んだ汎用テーブル。
 * 並べ替え・列の絞り込み・ページ送りをクライアント側で行い、状態はこのコンポーネントの中に持つ。
 * 並べ替えの対象にするかは列定義の `enableSorting`、絞り込み方は `filterFn` で列ごとに決める。
 */
export function DataTable<TData, TValue>({
    data,
    columns,
    initialSorting = [],
    pageSize = 50,
    emptyMessage = '該当するデータがありません',
    toolbar,
}: DataTableProps<TData, TValue>) {
    const [sorting, setSorting] = useState<SortingState>(initialSorting)
    const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
    const [pagination, setPagination] = useState({ pageIndex: 0, pageSize })

    const table = useReactTable({
        data,
        columns,
        state: { sorting, columnFilters, pagination },
        onSortingChange: setSorting,
        onColumnFiltersChange: setColumnFilters,
        onPaginationChange: setPagination,
        // 昇順・降順を行き来させ、並べ替えなしには戻さない
        enableSortingRemoval: false,
        getCoreRowModel: getCoreRowModel(),
        getSortedRowModel: getSortedRowModel(),
        getFilteredRowModel: getFilteredRowModel(),
        getPaginationRowModel: getPaginationRowModel(),
    })

    const rows = table.getRowModel().rows
    const filteredCount = table.getFilteredRowModel().rows.length
    const firstRowNumber = pagination.pageIndex * pagination.pageSize + 1
    const lastRowNumber = firstRowNumber + rows.length - 1

    return (
        <div className='space-y-3'>
            {toolbar ? <div className='flex items-center gap-3'>{toolbar(table)}</div> : null}

            <Table>
                <TableHeader>
                    {table.getHeaderGroups().map((headerGroup) => (
                        <TableRow key={headerGroup.id}>
                            {headerGroup.headers.map((header) => {
                                const label = flexRender(header.column.columnDef.header, header.getContext())
                                if (!header.column.getCanSort()) {
                                    return <TableHead key={header.id}>{label}</TableHead>
                                }

                                const sorted = header.column.getIsSorted()
                                const SortIcon =
                                    sorted === 'asc' ? ArrowUp : sorted === 'desc' ? ArrowDown : ArrowUpDown

                                return (
                                    <TableHead
                                        key={header.id}
                                        aria-sort={sorted ? (sorted === 'asc' ? 'ascending' : 'descending') : 'none'}
                                    >
                                        <Button
                                            variant='ghost'
                                            size='sm'
                                            onClick={header.column.getToggleSortingHandler()}
                                            className='-ml-3'
                                        >
                                            {label}
                                            <SortIcon aria-hidden className='size-3.5' />
                                        </Button>
                                    </TableHead>
                                )
                            })}
                        </TableRow>
                    ))}
                </TableHeader>

                <TableBody>
                    {rows.length === 0 ? (
                        <TableRow>
                            <TableCell colSpan={columns.length} className='py-10 text-center text-muted-foreground'>
                                {emptyMessage}
                            </TableCell>
                        </TableRow>
                    ) : (
                        rows.map((row) => (
                            <TableRow key={row.id}>
                                {row.getVisibleCells().map((cell) => (
                                    <TableCell key={cell.id}>
                                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                    </TableCell>
                                ))}
                            </TableRow>
                        ))
                    )}
                </TableBody>
            </Table>

            <div className='flex items-center justify-end gap-3'>
                <p className='text-sm text-muted-foreground'>
                    {filteredCount === 0 ? '全0件' : `全${filteredCount}件中 ${firstRowNumber}〜${lastRowNumber}件`}
                </p>
                <Button
                    variant='outline'
                    size='sm'
                    onClick={() => table.previousPage()}
                    disabled={!table.getCanPreviousPage()}
                >
                    前へ
                </Button>
                <Button variant='outline' size='sm' onClick={() => table.nextPage()} disabled={!table.getCanNextPage()}>
                    次へ
                </Button>
            </div>
        </div>
    )
}
