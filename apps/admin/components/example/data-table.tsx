'use client'

import { useState } from 'react'

import {
    type ColumnDef,
    flexRender,
    getCoreRowModel,
    getFilteredRowModel,
    getSortedRowModel,
    type SortingState,
    useReactTable,
} from '@tanstack/react-table'
import { ArrowDown, ArrowUp, ArrowUpDown } from 'lucide-react'

import { Button } from '~/components/ui/button'
import { Input } from '~/components/ui/input'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '~/components/ui/table'

export type DataTableProps<TData, TValue> = {
    data: TData[]
    columns: ColumnDef<TData, TValue>[]
    /** 絞り込み欄のラベル（アクセシビリティ用） */
    filterLabel?: string
    onRowClick?: (row: TData) => void
}

/**
 * TanStack Table（ヘッドレス）の配線確認用の汎用テーブル。
 * ソートとグローバルフィルタだけ持つ。
 * 機能ごとに列定義（columns）を渡して使う想定。
 */
export function DataTable<TData, TValue>({
    data,
    columns,
    filterLabel = '絞り込み',
    onRowClick,
}: DataTableProps<TData, TValue>) {
    const [sorting, setSorting] = useState<SortingState>([])
    const [globalFilter, setGlobalFilter] = useState('')

    const table = useReactTable({
        data,
        columns,
        state: { sorting, globalFilter },
        onSortingChange: setSorting,
        onGlobalFilterChange: setGlobalFilter,
        getCoreRowModel: getCoreRowModel(),
        getSortedRowModel: getSortedRowModel(),
        getFilteredRowModel: getFilteredRowModel(),
    })

    return (
        <div className='space-y-3'>
            <Input
                type='search'
                placeholder={filterLabel}
                aria-label={filterLabel}
                value={globalFilter}
                onChange={(event) => setGlobalFilter(event.target.value)}
                className='max-w-xs'
            />

            <Table>
                <TableHeader>
                    {table.getHeaderGroups().map((headerGroup) => (
                        <TableRow key={headerGroup.id}>
                            {headerGroup.headers.map((header) => {
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
                                            {flexRender(header.column.columnDef.header, header.getContext())}
                                            <SortIcon aria-hidden className='size-3.5' />
                                        </Button>
                                    </TableHead>
                                )
                            })}
                        </TableRow>
                    ))}
                </TableHeader>

                <TableBody>
                    {table.getRowModel().rows.length === 0 ? (
                        <TableRow>
                            <TableCell colSpan={columns.length} className='py-10 text-center text-muted-foreground'>
                                該当するデータがありません
                            </TableCell>
                        </TableRow>
                    ) : (
                        table.getRowModel().rows.map((row) => (
                            <TableRow
                                key={row.id}
                                onClick={() => onRowClick?.(row.original)}
                                className={onRowClick ? 'cursor-pointer' : undefined}
                            >
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
        </div>
    )
}
