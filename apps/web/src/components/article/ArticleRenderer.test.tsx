import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen, within } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import type { ArticleBlock, ArticleDocument, ArticleStyles } from '@fesp/schema'

import { ArticleRenderer } from './ArticleRenderer'
import { blockRegistry } from './block-registry'

const defaultBlockProps = { backgroundColor: 'default', textColor: 'default', textAlignment: 'left' }

const text = (value: string, styles: ArticleStyles = {}) => ({ type: 'text' as const, text: value, styles })

const block = (
    id: string,
    type: ArticleBlock['type'],
    content: ArticleBlock['content'],
    { props = {}, children = [] }: { props?: Record<string, unknown>; children?: ArticleBlock[] } = {},
): ArticleBlock => ({ id, type, props: { ...defaultBlockProps, ...props }, content, children })

const renderBlocks = (blocks: ArticleDocument) => render(<ArticleRenderer blocks={blocks} />)

describe('ArticleRenderer', () => {
    it('段落を描画し、見出しはレベルを1段下げる', () => {
        renderBlocks([
            block('1', 'heading', [text('今日の模擬店')], { props: { level: 1 } }),
            block('2', 'heading', [text('小見出し')], { props: { level: 6 } }),
            block('3', 'paragraph', [text('現金のみです。')]),
        ])

        expect(screen.getByRole('heading', { level: 2, name: '今日の模擬店' })).toBeInTheDocument()
        expect(screen.getByRole('heading', { level: 6, name: '小見出し' })).toBeInTheDocument()
        expect(screen.getByText('現金のみです。').tagName).toBe('P')
    })

    it('続いている箇条書き・番号付きリストを1つのリストにまとめ、番号は start から振る', () => {
        renderBlocks([
            block('1', 'bulletListItem', [text('たこ焼き')]),
            block('2', 'bulletListItem', [text('焼きそば')]),
            block('3', 'paragraph', [text('区切り')]),
            block('4', 'numberedListItem', [text('受付')], { props: { start: 3 } }),
            block('5', 'numberedListItem', [text('入場')]),
        ])

        const [bulletList, numberedList] = screen.getAllByRole('list')
        expect(bulletList?.tagName).toBe('UL')
        expect(within(bulletList!).getAllByRole('listitem')).toHaveLength(2)
        expect(numberedList?.tagName).toBe('OL')
        expect(numberedList).toHaveAttribute('start', '3')
        expect(within(numberedList!).getAllByRole('listitem')).toHaveLength(2)
    })

    it('子ブロックをブロックの下に描画する（ネストしたリスト）', () => {
        renderBlocks([
            block('1', 'bulletListItem', [text('準備')], {
                children: [block('1-1', 'bulletListItem', [text('設営')])],
            }),
        ])

        const [outerItem] = screen.getAllByRole('listitem')
        expect(within(outerItem!).getByRole('list')).toHaveTextContent('設営')
    })

    it('チェックリストは操作できないチェックボックスで、checked を反映する', () => {
        renderBlocks([
            block('1', 'checkListItem', [text('設営完了')], { props: { checked: true } }),
            block('2', 'checkListItem', [text('撤収')], { props: { checked: false } }),
        ])

        expect(screen.getByRole('checkbox', { name: '設営完了' })).toBeChecked()
        expect(screen.getByRole('checkbox', { name: '設営完了' })).toBeDisabled()
        expect(screen.getByRole('checkbox', { name: '撤収' })).not.toBeChecked()
    })

    it('トグルリストは閉じた状態で描画し、子ブロックを中に入れる', () => {
        const { container } = renderBlocks([
            block('1', 'toggleListItem', [text('詳細')], {
                children: [block('1-1', 'paragraph', [text('中身')])],
            }),
        ])

        const details = container.querySelector('details')
        expect(details).not.toHaveAttribute('open')
        expect(details?.querySelector('summary')).toHaveTextContent('詳細')
        expect(details).toHaveTextContent('中身')
    })

    it('引用・区切り線・コードブロックを描画する', () => {
        const { container } = renderBlocks([
            { id: '1', type: 'quote', props: {}, content: [text('雨天でも開催します')], children: [] },
            { id: '2', type: 'divider', props: {}, children: [] },
            { id: '3', type: 'codeBlock', props: { language: 'js' }, content: [text('const x = 1')], children: [] },
        ])

        expect(container.querySelector('blockquote')).toHaveTextContent('雨天でも開催します')
        expect(screen.getByRole('separator')).toBeInTheDocument()
        expect(container.querySelector('pre > code')).toHaveTextContent('const x = 1')
    })

    it('表は headerRows・headerCols を見出しセルにし、colspan を反映する', () => {
        renderBlocks([
            {
                id: '1',
                type: 'table',
                props: { textColor: 'default' },
                content: {
                    type: 'tableContent',
                    columnWidths: [undefined, undefined],
                    headerRows: 1,
                    headerCols: 1,
                    rows: [
                        {
                            cells: [
                                {
                                    type: 'tableCell',
                                    props: { ...defaultBlockProps } as never,
                                    content: [text('模擬店')],
                                },
                                {
                                    type: 'tableCell',
                                    props: { ...defaultBlockProps } as never,
                                    content: [text('会場')],
                                },
                            ],
                        },
                        {
                            cells: [
                                {
                                    type: 'tableCell',
                                    props: { ...defaultBlockProps } as never,
                                    content: [text('たこ焼き')],
                                },
                                {
                                    type: 'tableCell',
                                    props: { ...defaultBlockProps } as never,
                                    content: [text('中庭')],
                                },
                            ],
                        },
                        {
                            cells: [
                                {
                                    type: 'tableCell',
                                    props: { ...defaultBlockProps, colspan: 2 } as never,
                                    content: [text('雨天時は体育館')],
                                },
                            ],
                        },
                    ],
                },
                children: [],
            },
        ])

        expect(screen.getByRole('columnheader', { name: '模擬店' })).toBeInTheDocument()
        expect(screen.getByRole('columnheader', { name: '会場' })).toBeInTheDocument()
        expect(screen.getByRole('rowheader', { name: 'たこ焼き' })).toBeInTheDocument()
        expect(screen.getByRole('cell', { name: '中庭' })).toBeInTheDocument()
        expect(screen.getByText('雨天時は体育館').closest('th, td')).toHaveAttribute('colspan', '2')
    })

    it('文字の装飾（太字・斜体・下線・取り消し線・インラインコード）を反映する', () => {
        renderBlocks([
            block('1', 'paragraph', [
                text('太字', { bold: true }),
                text('斜体', { italic: true }),
                text('下線', { underline: true }),
                text('取り消し', { strike: true }),
                text('コード', { code: true }),
            ]),
        ])

        expect(screen.getByText('太字').tagName).toBe('STRONG')
        expect(screen.getByText('斜体').tagName).toBe('EM')
        expect(screen.getByText('下線').tagName).toBe('U')
        expect(screen.getByText('取り消し').tagName).toBe('S')
        expect(screen.getByText('コード').tagName).toBe('CODE')
    })

    it('http(s) のリンクは新しいタブで開き、mailto はそのまま開き、許可しないプロトコルはリンクにしない', () => {
        renderBlocks([
            block('1', 'paragraph', [
                { type: 'link', href: 'https://example.com', content: [text('公式サイト')] },
                { type: 'link', href: 'mailto:info@example.com', content: [text('お問い合わせ')] },
                { type: 'link', href: 'javascript:alert(1)', content: [text('危ないリンク')] },
            ]),
        ])

        const site = screen.getByRole('link', { name: '公式サイト' })
        expect(site).toHaveAttribute('href', 'https://example.com')
        expect(site).toHaveAttribute('target', '_blank')
        expect(site).toHaveAttribute('rel', 'noopener noreferrer')
        expect(screen.getByRole('link', { name: 'お問い合わせ' })).not.toHaveAttribute('target')
        expect(screen.queryByRole('link', { name: '危ないリンク' })).not.toBeInTheDocument()
        expect(screen.getByText('危ないリンク')).toBeInTheDocument()
    })

    it('レジストリに無い type のブロックは飛ばして、続きを描画する', () => {
        render(
            <ArticleRenderer
                blocks={[
                    { id: '1', type: 'quote', props: {}, content: [text('引用')], children: [] },
                    block('2', 'paragraph', [text('続きの段落')]),
                ]}
                registry={{ ...blockRegistry, quote: undefined }}
            />,
        )

        expect(screen.queryByText('引用')).not.toBeInTheDocument()
        expect(screen.getByText('続きの段落')).toBeInTheDocument()
    })

    it('ページ見出しは英語ラベル（大文字）と日本語タイトル（h1）を header に出す', () => {
        renderBlocks([{ id: '1', type: 'pageHeader', props: { label: 'news', title: 'お知らせ' }, children: [] }])

        const header = screen.getByRole('banner')
        expect(header).toContainElement(screen.getByRole('heading', { level: 1, name: 'お知らせ' }))
        expect(screen.getByText('news')).toHaveClass('uppercase', 'font-en')
    })

    it('ページ見出しは空の行を出さず、両方とも空なら header ごと出さない', () => {
        const { rerender } = renderBlocks([
            { id: '1', type: 'pageHeader', props: { label: '', title: 'お知らせ' }, children: [] },
        ])
        expect(screen.getByRole('banner').childElementCount).toBe(1)

        rerender(
            <ArticleRenderer
                blocks={[{ id: '1', type: 'pageHeader', props: { label: 'NEWS', title: '' }, children: [] }]}
            />,
        )
        expect(screen.queryByRole('heading')).not.toBeInTheDocument()
        expect(screen.getByText('NEWS')).toBeInTheDocument()

        rerender(
            <ArticleRenderer
                blocks={[{ id: '1', type: 'pageHeader', props: { label: '', title: '' }, children: [] }]}
            />,
        )
        expect(screen.queryByRole('banner')).not.toBeInTheDocument()
    })

    it('マップは地図の領域とボトムシートの場所の一覧を出し、そのあとのブロックの描画を続ける', async () => {
        render(
            <QueryClientProvider client={new QueryClient()}>
                <ArticleRenderer
                    blocks={[
                        { id: '1', type: 'map', props: {}, children: [] },
                        block('2', 'paragraph', [text('続きの段落')]),
                    ]}
                />
            </QueryClientProvider>,
        )

        expect(screen.getByRole('region', { name: 'マップ' })).toHaveClass('h-dvh')
        expect(screen.getByRole('searchbox', { name: '場所・模擬店を検索' })).toBeInTheDocument()
        expect(await screen.findByRole('list', { name: '場所の一覧' })).toBeInTheDocument()
        expect(screen.getByText('続きの段落')).toBeInTheDocument()
    })

    it('レジストリを差し替えると、差し替えたコンポーネントで描画する', () => {
        render(
            <ArticleRenderer
                blocks={[block('1', 'paragraph', [text('本文')])]}
                registry={{ ...blockRegistry, paragraph: ({ block }) => <p>差し替え: {block.id}</p> }}
            />,
        )

        expect(screen.getByText('差し替え: 1')).toBeInTheDocument()
    })
})
