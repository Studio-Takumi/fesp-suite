import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'

import type { ArticleBlock, ArticleDocument, ArticleStyles } from '@fesp/schema'

import { type Artist, mockArtists } from '~/lib/mock/artist'
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

const artistList = (props: Record<string, unknown> = {}) =>
    componentBlock('artistList', {
        showDateTabs: false,
        showSearch: false,
        showSort: false,
        showTagTabs: false,
        tags: '',
        ...props,
    })

const artist = (id: string, name: string, startsAt: string): Artist => ({
    id,
    name,
    program: '有志ステージ',
    group: '有志',
    day: 1,
    starts_at: startsAt,
    ends_at: startsAt,
    venue: '中庭ステージ',
    member_count: 3,
    tags: [],
})

const artistNames = () => screen.getAllByRole('listitem').map((item) => within(item).getByRole('heading').textContent)

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

    it('出演者一覧はカードを出演の早い順に並べ、カードは出演者へのリンクにする', async () => {
        renderWithQuery([artistList()])

        const rows = await screen.findAllByRole('listitem')
        expect(rows).toHaveLength(mockArtists.length)
        const first = within(rows[0]!)
        expect(first.getByRole('link')).toHaveAttribute('href', '/artists/artist-1')
        expect(first.getAllByText('ソラノネ')).toHaveLength(2)
        expect(first.getByText('アコースティックライブ')).toBeInTheDocument()
        expect(first.getByText('Day1')).toBeInTheDocument()
        expect(first.getByText('軽音楽部')).toBeInTheDocument()
        expect(first.getByText('10:20 - 11:00')).toBeInTheDocument()
        expect(first.getByText('体育館ステージ')).toBeInTheDocument()
        expect(screen.queryByRole('tablist')).not.toBeInTheDocument()
        expect(screen.queryByRole('searchbox')).not.toBeInTheDocument()
        expect(screen.queryByRole('combobox')).not.toBeInTheDocument()
    })

    it('出演者一覧は「すべて」と出演する日のタブを出し、日で絞り込む', async () => {
        const user = userEvent.setup()
        renderWithQuery([artistList({ showDateTabs: true })])

        const tabs = await screen.findAllByRole('tab')
        expect(tabs.map((tab) => tab.textContent)).toEqual(['すべて', 'Day16/6(土)', 'Day26/7(日)'])
        expect(screen.getByRole('tab', { name: 'すべて' })).toHaveAttribute('aria-selected', 'true')

        await user.click(tabs[2]!)

        expect(tabs[2]!).toHaveAttribute('aria-selected', 'true')
        expect(screen.getAllByRole('listitem')).toHaveLength(3)
    })

    it('出演者一覧は検索の文字で出演者名・演目・団体名を絞り込む', async () => {
        const user = userEvent.setup()
        renderWithQuery([artistList({ showSearch: true })])

        expect(await screen.findAllByRole('listitem')).toHaveLength(mockArtists.length)

        await user.type(screen.getByRole('searchbox', { name: '出演者・演目で検索' }), ' ダンス ')

        expect(artistNames()).toEqual(['ダンス部'])
    })

    it('出演者一覧は並び替えで出演順・名前順を切り替える', async () => {
        const user = userEvent.setup()
        renderWithQuery(
            [artistList({ showSort: true })],
            [
                [
                    queryKeys.artists,
                    [
                        artist('a', 'サクラ', '2026-06-06T10:00:00+09:00'),
                        artist('b', 'カエデ', '2026-06-06T11:00:00+09:00'),
                        artist('c', 'アオイ', '2026-06-06T12:00:00+09:00'),
                    ],
                ],
            ],
        )

        expect(await screen.findAllByRole('listitem')).toHaveLength(3)
        expect(artistNames()).toEqual(['サクラ', 'カエデ', 'アオイ'])

        await user.selectOptions(screen.getByRole('combobox', { name: '並び替え' }), '名前順')

        expect(artistNames()).toEqual(['アオイ', 'カエデ', 'サクラ'])
    })

    it('出演者一覧は「すべて」と選んだタグのタブを出し、タブで絞り込む', async () => {
        const user = userEvent.setup()
        renderWithQuery([artistList({ showTagTabs: true, tags: 'dance,band,unknown' })])

        const tabs = await screen.findAllByRole('tab')
        // 並びはタグの一覧の順。タグの一覧に無い ID は出さない
        expect(tabs.map((tab) => tab.textContent)).toEqual(['すべて', 'バンド', 'ダンス'])

        await user.click(screen.getByRole('tab', { name: 'ダンス' }))

        expect(artistNames()).toEqual(['ハルカゼ団', 'ダンス部'])
    })

    it('出演者一覧はタグタブを出す設定でも、タグを選んでいなければタブを出さない', async () => {
        renderWithQuery([artistList({ showTagTabs: true, tags: '' })])

        expect(await screen.findAllByRole('listitem')).toHaveLength(mockArtists.length)
        expect(screen.queryByRole('tablist')).not.toBeInTheDocument()
    })

    it('出演者一覧は0件なら空状態を出す', async () => {
        renderWithQuery([artistList({ showDateTabs: true })], [[queryKeys.artists, []]])

        expect(await screen.findByRole('heading', { name: '出演者はまだありません' })).toBeInTheDocument()
        expect(screen.getByText('出演者が公開されると、ここに表示されます。')).toBeInTheDocument()
        expect(screen.getByRole('button', { name: '再読み込み' })).toBeInTheDocument()
        expect(screen.queryByRole('list')).not.toBeInTheDocument()
    })

    it('出演者のサマリーは Day・団体・演目・出演日時・会場・人数と、スケジュール・マップへのボタンを出す', async () => {
        renderWithQuery([componentBlock('artistSummary')])

        expect(await screen.findByRole('heading', { level: 1, name: 'ソラノネ' })).toBeInTheDocument()
        expect(screen.getByText('Day1')).toBeInTheDocument()
        expect(screen.getByText('軽音楽部')).toBeInTheDocument()
        expect(screen.getByText('アコースティックライブ')).toBeInTheDocument()
        expect(screen.getByText('1日目 10:20 - 11:00')).toBeInTheDocument()
        expect(screen.getByText('体育館ステージ')).toBeInTheDocument()
        expect(screen.getByText('5名')).toBeInTheDocument()
        expect(screen.getByRole('link', { name: 'スケジュールで見る' })).toHaveAttribute('href', '/schedule')
        expect(screen.getByRole('link', { name: '会場をマップで見る' })).toHaveAttribute('href', '/map')
    })

    it('セットリストは曲名と原曲のアーティストを順番に並べ、曲が無ければ何も出さない', async () => {
        const { unmount } = renderWithQuery([componentBlock('setList')])

        expect(await screen.findByRole('heading', { level: 2, name: 'セットリスト' })).toBeInTheDocument()
        const songs = screen.getAllByRole('listitem')
        expect(songs).toHaveLength(4)
        expect(songs[0]).toHaveTextContent('1Take the A TrainDuke Ellington')
        expect(songs[3]).toHaveTextContent('4情熱大陸葉加瀬太郎')
        unmount()

        renderWithQuery([componentBlock('setList')], [[queryKeys.setList, []]])
        expect(screen.queryByRole('heading', { name: 'セットリスト' })).not.toBeInTheDocument()
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

    it('マップは地図の領域とボトムシートの場所の一覧を出し、そのあとのブロックの描画を続ける', async () => {
        renderWithQuery([
            { id: '1', type: 'map', props: {}, children: [] },
            block('2', 'paragraph', [text('続きの段落')]),
        ])

        expect(screen.getByRole('region', { name: 'マップ' })).toHaveClass('h-dvh')
        expect(screen.getByRole('searchbox', { name: '場所・模擬店を検索' })).toBeInTheDocument()
        expect(await screen.findByRole('list', { name: '場所の一覧' })).toBeInTheDocument()
        expect(screen.getByText('続きの段落')).toBeInTheDocument()
    })

    it('注意書きは種類ごとの見出し・色の枠に本文を出す', () => {
        const callout = (id: string, variant: string, value: string): ArticleBlock => ({
            id,
            type: 'callout',
            props: { variant },
            content: [text(value)],
            children: [],
        })
        renderBlocks([
            callout('1', 'info', '入場は無料です'),
            callout('2', 'caution', '現金のみです'),
            callout('3', 'warning', '火気厳禁です'),
        ])

        const info = screen.getByRole('note', { name: '情報' })
        expect(info).toHaveClass('bg-emerald-50', 'border-emerald-300')
        expect(within(info).getByText('情報')).toHaveClass('font-bold', 'text-emerald-800')
        expect(info).toHaveTextContent('入場は無料です')

        const caution = screen.getByRole('note', { name: '注意' })
        expect(caution).toHaveClass('bg-amber-50', 'border-amber-300')
        expect(within(caution).getByText('注意')).toHaveClass('text-amber-800')
        expect(caution).toHaveTextContent('現金のみです')

        const warning = screen.getByRole('note', { name: '警告' })
        expect(warning).toHaveClass('bg-red-50', 'border-red-300')
        expect(within(warning).getByText('警告')).toHaveClass('text-red-800')
        expect(warning).toHaveTextContent('火気厳禁です')
    })

    it('注意書きの子ブロックは1段下げずに枠の中に出し、本文が空なら本文の行を出さない', () => {
        renderBlocks([
            {
                id: '1',
                type: 'callout',
                props: { variant: 'caution' },
                content: [],
                children: [
                    block('1-1', 'bulletListItem', [text('整理券を配ることがあります')]),
                    block('1-2', 'bulletListItem', [text('値段が変わることがあります')]),
                ],
            },
            block('2', 'paragraph', [text('枠の外')]),
        ])

        const note = screen.getByRole('note', { name: '注意' })
        expect(within(note).getAllByRole('listitem')).toHaveLength(2)
        expect(within(note).getByRole('list').parentElement).not.toHaveClass('pl-6')
        expect(note.querySelector('p')).not.toBeInTheDocument()
        expect(note).not.toHaveTextContent('枠の外')
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
