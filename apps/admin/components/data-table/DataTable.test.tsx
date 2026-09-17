import type { ColumnDef } from '@tanstack/react-table'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'

import { DataTable } from './DataTable'

type Row = { id: string; name: string; status: string }

const data: Row[] = [
    { id: '1', name: 'いちご', status: '公開' },
    { id: '2', name: 'ぶどう', status: '下書き' },
    { id: '3', name: 'あんず', status: '公開' },
]

const columns: ColumnDef<Row>[] = [
    { accessorKey: 'name', header: '名前' },
    { accessorKey: 'status', header: '状態', enableSorting: false },
]

const bodyRows = () => within(screen.getAllByRole('rowgroup')[1]!).getAllByRole('row')

/** 名前を絞り込む入力欄をツールバーに出す */
function renderWithNameFilter(rows: Row[], pageSize?: number) {
    return render(
        <DataTable
            data={rows}
            columns={columns}
            pageSize={pageSize}
            toolbar={(table) => (
                <input
                    aria-label='名前で検索'
                    onChange={(event) => table.getColumn('name')?.setFilterValue(event.target.value)}
                />
            )}
        />,
    )
}

describe('DataTable（TanStack Table）', () => {
    it('全行を描画する', () => {
        render(<DataTable data={data} columns={columns} />)
        expect(bodyRows()).toHaveLength(3)
    })

    it('initialSorting の順で並べる', () => {
        render(<DataTable data={data} columns={columns} initialSorting={[{ id: 'name', desc: true }]} />)
        expect(bodyRows().map((row) => row.textContent)).toEqual(['ぶどう下書き', 'いちご公開', 'あんず公開'])
    })

    it('ヘッダークリックで昇順・降順が切り替わり、並べ替えなしには戻らない', async () => {
        render(<DataTable data={data} columns={columns} />)
        const nameHeader = screen.getByRole('button', { name: /名前/ })

        await userEvent.click(nameHeader)
        expect(bodyRows()[0]).toHaveTextContent('あんず')
        expect(screen.getByRole('columnheader', { name: /名前/ })).toHaveAttribute('aria-sort', 'ascending')

        await userEvent.click(nameHeader)
        expect(bodyRows()[0]).toHaveTextContent('ぶどう')
        expect(screen.getByRole('columnheader', { name: /名前/ })).toHaveAttribute('aria-sort', 'descending')

        await userEvent.click(nameHeader)
        expect(bodyRows()[0]).toHaveTextContent('あんず')
    })

    it('enableSorting: false の列はボタンにしない', () => {
        render(<DataTable data={data} columns={columns} />)
        expect(screen.queryByRole('button', { name: /状態/ })).not.toBeInTheDocument()
        expect(screen.getByRole('columnheader', { name: '状態' })).toBeInTheDocument()
    })

    it('ツールバーから列を絞り込める', async () => {
        renderWithNameFilter(data)

        await userEvent.type(screen.getByLabelText('名前で検索'), 'ぶどう')

        const rows = bodyRows()
        expect(rows).toHaveLength(1)
        expect(rows[0]).toHaveTextContent('ぶどう')
        expect(screen.getByText('全1件中 1〜1件')).toBeInTheDocument()
    })

    it('絞り込んで0行なら emptyMessage を出す', async () => {
        render(
            <DataTable
                data={data}
                columns={columns}
                emptyMessage='条件に合うものがありません'
                toolbar={(table) => (
                    <input
                        aria-label='名前で検索'
                        onChange={(event) => table.getColumn('name')?.setFilterValue(event.target.value)}
                    />
                )}
            />,
        )

        await userEvent.type(screen.getByLabelText('名前で検索'), '存在しない')

        expect(screen.getByText('条件に合うものがありません')).toBeInTheDocument()
        expect(screen.getByText('全0件')).toBeInTheDocument()
    })

    describe('ページ送り', () => {
        const manyRows: Row[] = Array.from({ length: 5 }, (_, index) => ({
            id: String(index + 1),
            name: `項目${index + 1}`,
            status: '公開',
        }))

        it('pageSize 行ずつ出し、「前へ」「次へ」で移動する', async () => {
            render(<DataTable data={manyRows} columns={columns} pageSize={2} />)
            const previous = screen.getByRole('button', { name: '前へ' })
            const next = screen.getByRole('button', { name: '次へ' })

            expect(bodyRows()).toHaveLength(2)
            expect(screen.getByText('全5件中 1〜2件')).toBeInTheDocument()
            expect(previous).toBeDisabled()
            expect(next).toBeEnabled()

            await userEvent.click(next)
            expect(bodyRows()[0]).toHaveTextContent('項目3')
            expect(screen.getByText('全5件中 3〜4件')).toBeInTheDocument()
            expect(previous).toBeEnabled()

            await userEvent.click(next)
            expect(bodyRows()).toHaveLength(1)
            expect(screen.getByText('全5件中 5〜5件')).toBeInTheDocument()
            expect(next).toBeDisabled()

            await userEvent.click(previous)
            expect(screen.getByText('全5件中 3〜4件')).toBeInTheDocument()
        })

        it('絞り込みを変えたら1ページ目に戻る', async () => {
            renderWithNameFilter(manyRows, 2)

            await userEvent.click(screen.getByRole('button', { name: '次へ' }))
            expect(screen.getByText('全5件中 3〜4件')).toBeInTheDocument()

            await userEvent.type(screen.getByLabelText('名前で検索'), '項目')

            expect(screen.getByText('全5件中 1〜2件')).toBeInTheDocument()
            expect(bodyRows()[0]).toHaveTextContent('項目1')
        })
    })
})
