import type { ColumnDef } from '@tanstack/react-table'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import { DataTable } from './data-table'

type Row = { id: string; name: string; status: string }

const data: Row[] = [
    { id: '1', name: 'いちご', status: '公開' },
    { id: '2', name: 'ぶどう', status: '下書き' },
    { id: '3', name: 'あんず', status: '公開' },
]

const columns: ColumnDef<Row>[] = [
    { accessorKey: 'name', header: '名前' },
    { accessorKey: 'status', header: '状態' },
]

const bodyRows = () => within(screen.getAllByRole('rowgroup')[1]!).getAllByRole('row')

describe('DataTable（TanStack Table）', () => {
    it('全行を描画する', () => {
        render(<DataTable data={data} columns={columns} />)
        expect(bodyRows()).toHaveLength(3)
    })

    it('フィルタで絞り込める', async () => {
        render(<DataTable data={data} columns={columns} />)

        await userEvent.type(screen.getByLabelText('絞り込み'), 'ぶどう')

        const rows = bodyRows()
        expect(rows).toHaveLength(1)
        expect(rows[0]).toHaveTextContent('ぶどう')
    })

    it('該当なしのときは空メッセージを出す', async () => {
        render(<DataTable data={data} columns={columns} />)
        await userEvent.type(screen.getByLabelText('絞り込み'), '存在しない')
        expect(screen.getByText('該当するデータがありません')).toBeInTheDocument()
    })

    it('ヘッダークリックで昇順・降順が切り替わる', async () => {
        render(<DataTable data={data} columns={columns} />)
        const nameHeader = screen.getByRole('button', { name: /名前/ })

        await userEvent.click(nameHeader)
        expect(bodyRows()[0]).toHaveTextContent('あんず')

        await userEvent.click(nameHeader)
        expect(bodyRows()[0]).toHaveTextContent('ぶどう')
    })

    it('行クリックで onRowClick が呼ばれる', async () => {
        const onRowClick = vi.fn()
        render(<DataTable data={data} columns={columns} onRowClick={onRowClick} />)

        await userEvent.click(screen.getByText('いちご'))
        expect(onRowClick).toHaveBeenCalledWith(expect.objectContaining({ name: 'いちご' }))
    })
})
