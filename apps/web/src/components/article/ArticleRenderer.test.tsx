import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'

import type { ArticleBlock, ArticleDocument, ArticleStyles } from '@fesp/schema'

import { mockNewsPosts, type NewsPost } from '~/lib/mock/news'
import { createMockWeather } from '~/lib/mock/weather'
import { queryKeys, weatherQuery } from '~/lib/queries'
import { createTestQueryClient, renderWithQueryClient } from '~/test/render'

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

/**
 * データを読む独自コンポーネント用。`data` を渡すとそのキーにデータを入れておき、仮データの代わりに使う
 * （`staleTime: Infinity` なので読み直さない）
 */
const renderWithQuery = (blocks: ArticleDocument, data: [readonly unknown[], unknown][] = []) => {
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false, staleTime: Infinity } } })
    for (const [key, value] of data) queryClient.setQueryData(key, value)
    return render(
        <QueryClientProvider client={queryClient}>
            <ArticleRenderer blocks={blocks} />
        </QueryClientProvider>,
    )
}

const componentBlock = (type: ArticleBlock['type'], props: Record<string, unknown> = {}): ArticleBlock => ({
    id: '1',
    type,
    props,
    children: [],
})

const newsList = (props: Record<string, unknown> = {}) =>
    componentBlock('newsList', { showTagTabs: false, tags: '', showViewAll: false, ...props })

const newsPost = (id: string, title: string, tagIds: string[]): NewsPost => ({
    id,
    title,
    author: '実行委員会本部',
    published_at: '2026-06-06T11:30:00+09:00',
    updated_at: '2026-06-06T11:51:00+09:00',
    tags: tagIds.map((tagId) => ({ id: tagId, name: tagId === 'stage' ? 'ステージ' : '模擬店' })),
})

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

    it('お知らせ一覧は投稿者・タイトル・タグ・日付（ゼロ埋めしない月と日）の行を並べ、行はお知らせへのリンクにする', async () => {
        renderWithQuery([newsList()])

        const rows = await screen.findAllByRole('listitem')
        expect(rows).toHaveLength(mockNewsPosts.length)
        const first = within(rows[0]!)
        expect(first.getByRole('link')).toHaveAttribute('href', '/news/news-8')
        expect(first.getByText('模擬店の整理券について')).toBeInTheDocument()
        expect(first.getByText('実行委員会本部')).toBeInTheDocument()
        expect(first.getByText('#模擬店')).toBeInTheDocument()
        expect(first.getByText('6月')).toBeInTheDocument()
        expect(first.getByText('6')).toBeInTheDocument()
        expect(screen.queryByRole('tablist')).not.toBeInTheDocument()
        expect(screen.queryByRole('link', { name: 'すべて見る' })).not.toBeInTheDocument()
    })

    it('お知らせ一覧は「すべて」と選んだタグのタブを出し、タブで絞り込む', async () => {
        const user = userEvent.setup()
        renderWithQuery([newsList({ showTagTabs: true, tags: 'shop,stage,unknown' })])

        const tabs = await screen.findAllByRole('tab')
        // 並びはタグの一覧の順。タグの一覧に無い ID は出さない
        expect(tabs.map((tab) => tab.textContent)).toEqual(['すべて', 'ステージ', '模擬店'])
        expect(screen.getByRole('tab', { name: 'すべて' })).toHaveAttribute('aria-selected', 'true')

        await user.click(screen.getByRole('tab', { name: 'ステージ' }))

        expect(screen.getByRole('tab', { name: 'ステージ' })).toHaveAttribute('aria-selected', 'true')
        const rows = screen.getAllByRole('listitem')
        expect(rows).toHaveLength(2)
        for (const row of rows) expect(within(row).getByText('#ステージ')).toBeInTheDocument()
    })

    it('お知らせ一覧はタグタブを出す設定でも、タグを選んでいなければタブを出さない', async () => {
        renderWithQuery([newsList({ showTagTabs: true, tags: '' })])

        expect(await screen.findAllByRole('listitem')).toHaveLength(mockNewsPosts.length)
        expect(screen.queryByRole('tablist')).not.toBeInTheDocument()
    })

    it('お知らせ一覧は表示件数だけ出し、「すべて見る」を出す設定ならお知らせ一覧へのリンクを出す', async () => {
        renderWithQuery([newsList({ limit: 3, showViewAll: true })])

        expect(await screen.findAllByRole('listitem')).toHaveLength(3)
        expect(screen.getByRole('link', { name: 'すべて見る' })).toHaveAttribute('href', '/news')
    })

    it('お知らせ一覧は絞り込んだあとの先頭から表示件数だけ出す', async () => {
        const user = userEvent.setup()
        renderWithQuery(
            [newsList({ showTagTabs: true, tags: 'stage', limit: 1 })],
            [
                [
                    queryKeys.news,
                    [
                        newsPost('a', '模擬店A', ['shop']),
                        newsPost('b', 'ステージB', ['stage']),
                        newsPost('c', 'ステージC', ['stage']),
                    ],
                ],
            ],
        )

        await user.click(await screen.findByRole('tab', { name: 'ステージ' }))

        expect(screen.getAllByRole('listitem')).toHaveLength(1)
        expect(screen.getByText('ステージB')).toBeInTheDocument()
    })

    it('お知らせ一覧は0件なら空状態を出す', async () => {
        renderWithQuery([newsList({ showViewAll: true })], [[queryKeys.news, []]])

        expect(await screen.findByRole('heading', { name: 'お知らせはまだありません' })).toBeInTheDocument()
        expect(screen.getByText('運営からのお知らせが投稿されると、ここに表示されます。')).toBeInTheDocument()
        expect(screen.getByRole('button', { name: '再読み込み' })).toBeInTheDocument()
        expect(screen.queryByRole('list')).not.toBeInTheDocument()
    })

    it('記事の画像は URL の画像を出し、URL が空なら何も出さない', () => {
        const { container, rerender } = renderBlocks([
            componentBlock('coverImage', { imageUrl: 'https://example.com/cover.jpg' }),
        ])
        expect(container.querySelector('img')).toHaveAttribute('src', 'https://example.com/cover.jpg')

        rerender(<ArticleRenderer blocks={[componentBlock('coverImage', { imageUrl: '' })]} />)
        expect(container.querySelector('img')).not.toBeInTheDocument()
    })

    it('記事のサマリーは表示中の記事の作成者・更新日時（日本時間）・タグを出す', async () => {
        renderWithQuery([componentBlock('postSummary')])

        expect(await screen.findByText('実行委員会本部')).toBeInTheDocument()
        expect(screen.getByText('2026年6月6日 11:51')).toHaveAttribute('datetime', '2026-06-06T11:51:00+09:00')
        expect(screen.getByText('#ステージ')).toBeInTheDocument()
        expect(screen.getByText('#お知らせ')).toBeInTheDocument()
    })

    it('記事のサマリーはタグが無ければタグの行を出さない', async () => {
        renderWithQuery([componentBlock('postSummary')], [[queryKeys.currentPost, newsPost('a', 'タグなし', [])]])

        expect(await screen.findByText('実行委員会本部')).toBeInTheDocument()
        expect(screen.queryByText(/^#/)).not.toBeInTheDocument()
    })

    it('前後の記事は前の記事・次の記事へのリンクを出す', async () => {
        renderWithQuery([componentBlock('adjacentPosts')])

        const nav = await screen.findByRole('navigation', { name: '前後の記事' })
        const [previous, next] = within(nav).getAllByRole('link')
        expect(previous).toHaveTextContent('前の記事こまめに水分補給をしてください')
        expect(previous).toHaveAttribute('href', '/news/news-6')
        expect(next).toHaveTextContent('次の記事模擬店の整理券について')
        expect(next).toHaveAttribute('href', '/news/news-8')
    })

    it('前後の記事は無い方の行を出さず、両方とも無ければ何も出さない', async () => {
        const { unmount } = renderWithQuery(
            [componentBlock('adjacentPosts')],
            [[queryKeys.adjacentPosts, { previous: { id: 'a', title: '古い記事' }, next: null }]],
        )
        expect(await screen.findByText('古い記事')).toBeInTheDocument()
        expect(screen.queryByText('次の記事')).not.toBeInTheDocument()
        unmount()

        renderWithQuery([componentBlock('adjacentPosts')], [[queryKeys.adjacentPosts, { previous: null, next: null }]])
        expect(screen.queryByRole('navigation')).not.toBeInTheDocument()
    })

    it('天気のブロック（今日・週間予報・警報・暑さ指数・概況・更新時刻と出典）を天気のデータから描画する', () => {
        const queryClient = createTestQueryClient()
        queryClient.setQueryData(weatherQuery().queryKey, createMockWeather())

        renderWithQueryClient(
            <ArticleRenderer
                blocks={(
                    [
                        'todayWeather',
                        'weeklyForecast',
                        'weatherAlert',
                        'wbgt',
                        'weatherOverview',
                        'weatherCredit',
                    ] as const
                ).map((type) => ({ id: type, type, props: {}, children: [] }))}
            />,
            queryClient,
        )

        expect(screen.getByRole('region', { name: '今日の天気' })).toBeInTheDocument()
        expect(screen.getByRole('heading', { level: 2, name: '週間予報' })).toBeInTheDocument()
        expect(screen.getByRole('region', { name: '気象警報・注意報' })).toBeInTheDocument()
        expect(screen.getByRole('heading', { level: 2, name: '暑さ指数（WBGT）' })).toBeInTheDocument()
        expect(screen.getByRole('heading', { level: 2, name: '今日の天気概況' })).toBeInTheDocument()
        expect(screen.getByText(/更新 ・ 出典: 気象庁/)).toBeInTheDocument()
    })

    it('スケジュール表は日付タブと会場ごとのタイムテーブルを出す（仮データ）', async () => {
        renderWithQuery([{ id: '1', type: 'scheduleTable', props: { showDateTabs: true }, children: [] }])

        expect(await screen.findByRole('tablist', { name: '日付' })).toBeInTheDocument()
        expect(screen.getByRole('region', { name: 'スケジュール' })).toContainElement(
            screen.getByRole('list', { name: '体育館' }),
        )
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
