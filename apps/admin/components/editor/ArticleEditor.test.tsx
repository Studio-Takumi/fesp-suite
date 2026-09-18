import type { ReactNode } from 'react'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render as rtlRender, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import type { ArticleDocument } from '@fesp/schema'

import { ArticleEditor, articleSchema } from './ArticleEditor'

// 独自コンポーネント（お知らせ一覧）が lib/queries.ts を読むので、env と API クライアントを差し替える
vi.mock('~/lib/env', () => ({ env: { NEXT_PUBLIC_EVENT_ID: '0b7e6d5c-4a3b-4c2d-9e1f-a2b3c4d5e6f7' } }))
vi.mock('~/lib/api', () => ({ adminFetch: vi.fn() }))

/** 独自コンポーネントが仮データを TanStack Query で読むので、QueryClient の中で描画する */
function render(ui: ReactNode) {
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
    return rtlRender(<QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>)
}

const defaultBlockProps = { backgroundColor: 'default', textColor: 'default', textAlignment: 'left' } as const

describe('articleSchema', () => {
    it('テキスト・見出し・リスト・チェックリスト・トグルリスト・引用・注意書き・区切り線・表・コードブロックと、独自コンポーネント（ページ見出し・スケジュール表・マップ・お知らせ・ブログ・模擬店・出演者・天気）だけを許可する（画像・動画等は含まない）', () => {
        expect(Object.keys(articleSchema.blockSchema).sort()).toEqual(
            [
                'adjacentPosts',
                'blogList',
                'relatedPosts',
                'coverImage',
                'newsList',
                'artistList',
                'artistSummary',
                'setList',
                'shopList',
                'shopSummary',
                'productList',
                'map',
                'postSummary',
                'scheduleTable',
                'todayWeather',
                'weeklyForecast',
                'weatherAlert',
                'wbgt',
                'weatherOverview',
                'weatherCredit',
                'callout',
                'bulletListItem',
                'checkListItem',
                'codeBlock',
                'divider',
                'heading',
                'numberedListItem',
                'pageHeader',
                'paragraph',
                'quote',
                'table',
                'toggleListItem',
            ].sort(),
        )
    })
})

describe('ArticleEditor', () => {
    it('本文エディタを表示する', async () => {
        render(<ArticleEditor />)

        expect(await screen.findByLabelText('本文エディタ')).toBeInTheDocument()
    })

    it('contentで渡した記事ドキュメントの中身を表示する', async () => {
        const content: ArticleDocument = [
            {
                id: '1',
                type: 'heading',
                props: { ...defaultBlockProps, level: 2 },
                content: [{ type: 'text', text: '今日の模擬店', styles: {} }],
                children: [],
            },
            {
                id: '2',
                type: 'bulletListItem',
                props: defaultBlockProps,
                content: [{ type: 'text', text: 'たこ焼き', styles: { bold: true } }],
                children: [],
            },
            {
                id: '3',
                type: 'checkListItem',
                props: { ...defaultBlockProps, checked: true },
                content: [{ type: 'text', text: '設営完了', styles: {} }],
                children: [],
            },
            {
                id: '4',
                type: 'quote',
                props: { backgroundColor: 'default', textColor: 'default' },
                content: [{ type: 'text', text: '雨天でも開催します', styles: {} }],
                children: [],
            },
        ]

        render(<ArticleEditor content={content} />)

        expect(await screen.findByText('今日の模擬店')).toBeInTheDocument()
        expect(await screen.findByText('たこ焼き')).toBeInTheDocument()
        expect(await screen.findByText('設営完了')).toBeInTheDocument()
        expect(await screen.findByText('雨天でも開催します')).toBeInTheDocument()
    })

    it('ページ見出しの英語ラベル（大文字）・日本語タイトルを表示し、カーソルが別のブロックにあればサイドパネルを出さない', async () => {
        const content: ArticleDocument = [
            { id: '1', type: 'paragraph', props: defaultBlockProps, content: [], children: [] },
            { id: '2', type: 'pageHeader', props: { label: 'news', title: 'お知らせ' }, children: [] },
        ]

        render(<ArticleEditor content={content} />)

        expect(await screen.findByText('お知らせ')).toBeInTheDocument()
        expect(screen.getByText('news')).toHaveClass('uppercase')
        expect(screen.queryByRole('complementary', { name: 'コンポーネントの設定' })).not.toBeInTheDocument()
    })

    it('カーソルがページ見出しにあれば、サイドパネルにその props を出す', async () => {
        const content: ArticleDocument = [
            { id: '1', type: 'pageHeader', props: { label: 'NEWS', title: 'お知らせ' }, children: [] },
        ]

        render(<ArticleEditor content={content} />)

        expect(await screen.findByRole('complementary', { name: 'コンポーネントの設定' })).toBeInTheDocument()
        expect(screen.getByLabelText('日本語タイトル')).toHaveValue('お知らせ')
    })

    it('サイドパネルで入力すると、ブロックの props を変えて onChange に渡す', async () => {
        const user = userEvent.setup()
        const onChange = vi.fn()
        const content: ArticleDocument = [
            { id: '1', type: 'pageHeader', props: { label: 'NEWS', title: 'お知らせ' }, children: [] },
        ]

        render(<ArticleEditor content={content} onChange={onChange} />)

        const titleInput = await screen.findByLabelText('日本語タイトル')
        await user.clear(titleInput)
        await user.type(titleInput, 'ブログ')

        expect(await screen.findByText('ブログ', { selector: 'div' })).toBeInTheDocument()
        expect(onChange).toHaveBeenLastCalledWith([
            expect.objectContaining({ id: '1', type: 'pageHeader', props: { label: 'NEWS', title: 'ブログ' } }),
        ])
    })

    it('英語ラベル・日本語タイトルとも空のページ見出しは、スケルトンと入力を促す文言を出す', async () => {
        const content: ArticleDocument = [
            { id: '1', type: 'pageHeader', props: { label: '', title: '' }, children: [] },
        ]

        render(<ArticleEditor content={content} />)

        expect(await screen.findByTestId('page-header-skeleton')).toBeInTheDocument()
        expect(screen.getByText('右のパネルで入力してください')).toBeInTheDocument()
    })

    it('ページ見出しはカードで出し、カーソルがあるときだけ「編集中」にする', async () => {
        const content: ArticleDocument = [
            { id: '1', type: 'pageHeader', props: { label: 'NEWS', title: 'お知らせ' }, children: [] },
            { id: '2', type: 'pageHeader', props: { label: 'BLOG', title: 'ブログ' }, children: [] },
        ]

        render(<ArticleEditor content={content} />)

        // 開いた直後はカーソルが先頭のブロックにある
        expect(await screen.findByText('編集中')).toBeInTheDocument()
        expect(screen.getAllByText('ページ見出し', { selector: 'span' })).toHaveLength(2)
        expect(screen.getByText('設定')).toBeInTheDocument()
    })

    it('お知らせ一覧はカードに設定の要約を出す（タグはタグの一覧の順に名前で出す）', async () => {
        const content: ArticleDocument = [
            { id: '1', type: 'paragraph', props: defaultBlockProps, content: [], children: [] },
            {
                id: '2',
                type: 'newsList',
                props: { showTagTabs: true, tags: 'shop,stage', limit: 3, showViewAll: true },
                children: [],
            },
            {
                id: '3',
                type: 'newsList',
                props: { showTagTabs: true, tags: '', showViewAll: false },
                children: [],
            },
            {
                id: '4',
                type: 'newsList',
                props: { showTagTabs: false, tags: 'shop', showViewAll: false },
                children: [],
            },
        ]

        render(<ArticleEditor content={content} />)

        expect(await screen.findByText('タグタブ: あり（ステージ・模擬店）')).toBeInTheDocument()
        expect(screen.getByText('表示件数: 3')).toBeInTheDocument()
        expect(screen.getByText('すべて見る: あり')).toBeInTheDocument()
        expect(screen.getByText('タグタブ: あり（タグ未選択）')).toBeInTheDocument()
        expect(screen.getAllByText('表示件数: すべて')).toHaveLength(2)
        expect(screen.getByText('タグタブ: なし')).toBeInTheDocument()
    })

    it('記事の画像はカードに URL を出し、空なら設定されていないことを出す', async () => {
        const content: ArticleDocument = [
            { id: '1', type: 'coverImage', props: { imageUrl: 'https://example.com/cover.jpg' }, children: [] },
            { id: '2', type: 'coverImage', props: { imageUrl: '' }, children: [] },
        ]

        render(<ArticleEditor content={content} />)

        expect(await screen.findByText('画像: https://example.com/cover.jpg')).toBeInTheDocument()
        expect(screen.getByText('画像が設定されていません（ウェブアプリには何も出ません）')).toBeInTheDocument()
    })

    it('記事のサマリー・前後の記事はカードに説明を出し、選択中はサイドパネルに「設定する項目はありません」と出す', async () => {
        const content: ArticleDocument = [
            { id: '1', type: 'postSummary', props: {}, children: [] },
            { id: '2', type: 'adjacentPosts', props: {}, children: [] },
        ]

        render(<ArticleEditor content={content} />)

        expect(await screen.findByText('表示中の記事の作成者・日時・ハッシュタグを出します')).toBeInTheDocument()
        expect(screen.getByText('表示中の記事の前の記事・次の記事へのリンクを出します')).toBeInTheDocument()
        // 開いた直後はカーソルが先頭のブロック（記事のサマリー）にある
        const panel = await screen.findByRole('complementary', { name: 'コンポーネントの設定' })
        expect(within(panel).getByRole('heading', { name: '記事のサマリー' })).toBeInTheDocument()
        expect(within(panel).getByText('設定する項目はありません')).toBeInTheDocument()
    })

    it('お知らせ一覧のサイドパネルで表示件数を入れると props に入り、空にすると props から消す', async () => {
        const user = userEvent.setup()
        const onChange = vi.fn()
        const content: ArticleDocument = [
            {
                id: '1',
                type: 'newsList',
                props: { showTagTabs: true, tags: '', showViewAll: false },
                children: [],
            },
        ]

        render(<ArticleEditor content={content} onChange={onChange} />)

        const limitInput = await screen.findByLabelText('表示件数')
        await user.type(limitInput, '5')

        expect(await screen.findByText('表示件数: 5')).toBeInTheDocument()
        expect(onChange).toHaveBeenLastCalledWith([
            expect.objectContaining({ id: '1', type: 'newsList', props: expect.objectContaining({ limit: 5 }) }),
        ])

        await user.clear(limitInput)

        expect(await screen.findByText('表示件数: すべて')).toBeInTheDocument()
        const [block] = onChange.mock.lastCall?.[0] as ArticleDocument
        expect(block?.props.limit).toBeUndefined()
        expect(JSON.parse(JSON.stringify(block?.props))).toEqual({ showTagTabs: true, tags: '', showViewAll: false })
    })

    it('ブログ一覧はカードに設定の要約を出す（タグはタグの一覧の順に名前で出す）', async () => {
        const content: ArticleDocument = [
            { id: '1', type: 'paragraph', props: defaultBlockProps, content: [], children: [] },
            { id: '2', type: 'blogList', props: { showTagTabs: true, tags: 'day,prep' }, children: [] },
            { id: '3', type: 'blogList', props: { showTagTabs: true, tags: '' }, children: [] },
            { id: '4', type: 'blogList', props: { showTagTabs: false, tags: 'prep' }, children: [] },
        ]

        render(<ArticleEditor content={content} />)

        expect(await screen.findByText('タグタブ: あり（準備・当日）')).toBeInTheDocument()
        expect(screen.getByText('タグタブ: あり（タグ未選択）')).toBeInTheDocument()
        expect(screen.getByText('タグタブ: なし')).toBeInTheDocument()
        expect(screen.getAllByText('ブログ一覧', { selector: 'span' })).toHaveLength(3)
    })

    it('ブログ一覧のサイドパネルでタグを選ぶと、ブロックの props を変えて onChange に渡す', async () => {
        const user = userEvent.setup()
        const onChange = vi.fn()
        const content: ArticleDocument = [
            { id: '1', type: 'blogList', props: { showTagTabs: true, tags: '' }, children: [] },
        ]

        render(<ArticleEditor content={content} onChange={onChange} />)

        await user.click(await screen.findByRole('checkbox', { name: '当日' }))

        expect(await screen.findByText('タグタブ: あり（当日）')).toBeInTheDocument()
        expect(onChange).toHaveBeenLastCalledWith([
            expect.objectContaining({ id: '1', type: 'blogList', props: { showTagTabs: true, tags: 'day' } }),
        ])
    })

    it('関連する記事はカードに説明を出し、選択中はサイドパネルに「設定する項目はありません」と出す', async () => {
        const content: ArticleDocument = [{ id: '1', type: 'relatedPosts', props: {}, children: [] }]

        render(<ArticleEditor content={content} />)

        expect(await screen.findByText('表示中の記事に関連する記事を出します')).toBeInTheDocument()
        const panel = await screen.findByRole('complementary', { name: 'コンポーネントの設定' })
        expect(within(panel).getByRole('heading', { name: '関連する記事' })).toBeInTheDocument()
        expect(within(panel).getByText('設定する項目はありません')).toBeInTheDocument()
    })

    it('天気のブロックは、カードに名前と説明の1文を出す', async () => {
        const content: ArticleDocument = [
            { id: '1', type: 'paragraph', props: defaultBlockProps, content: [], children: [] },
            { id: '2', type: 'todayWeather', props: {}, children: [] },
            { id: '3', type: 'weeklyForecast', props: {}, children: [] },
            { id: '4', type: 'weatherAlert', props: {}, children: [] },
            { id: '5', type: 'wbgt', props: {}, children: [] },
            { id: '6', type: 'weatherOverview', props: {}, children: [] },
            { id: '7', type: 'weatherCredit', props: {}, children: [] },
        ]

        render(<ArticleEditor content={content} />)

        for (const [name, description] of [
            ['今日の天気', '今日の天気と気温を出します'],
            ['週間予報', '1週間分の天気と気温を横に並べて出します'],
            ['気象警報・注意報', '発表中の警報・注意報を出します（無いときは出しません）'],
            ['暑さ指数', '暑さ指数（WBGT）と段階を出します'],
            ['天気概況', '気象台の天気概況の文章を出します'],
            ['天気の更新時刻・出典', '天気の更新時刻と出典（気象庁）を出します'],
        ]) {
            expect(await screen.findByText(name!, { selector: 'span' })).toBeInTheDocument()
            expect(screen.getByText(description!)).toBeInTheDocument()
        }
        expect(screen.queryByRole('complementary', { name: 'コンポーネントの設定' })).not.toBeInTheDocument()
    })

    it('カーソルが天気のブロックにあれば、サイドパネルに名前と「設定する項目はありません」を出す', async () => {
        const content: ArticleDocument = [{ id: '1', type: 'wbgt', props: {}, children: [] }]

        render(<ArticleEditor content={content} />)

        const panel = await screen.findByRole('complementary', { name: 'コンポーネントの設定' })
        expect(within(panel).getByRole('heading', { name: '暑さ指数' })).toBeInTheDocument()
        expect(within(panel).getByText('設定する項目はありません')).toBeInTheDocument()
        expect(within(panel).queryByRole('textbox')).not.toBeInTheDocument()
    })

    it('スケジュール表はカードに設定の要約（日付タブの有無）だけを出す', async () => {
        const content: ArticleDocument = [
            { id: '1', type: 'scheduleTable', props: { showDateTabs: true }, children: [] },
            { id: '2', type: 'scheduleTable', props: { showDateTabs: false }, children: [] },
        ]

        render(<ArticleEditor content={content} />)

        expect(await screen.findByText('日付タブ: あり')).toBeInTheDocument()
        expect(screen.getByText('日付タブ: なし')).toBeInTheDocument()
        expect(screen.getAllByText('スケジュール表', { selector: 'span' }).length).toBeGreaterThanOrEqual(2)
    })

    it('スケジュール表のサイドパネルでスイッチを切り替えると、ブロックの props を変えて onChange に渡す', async () => {
        const user = userEvent.setup()
        const onChange = vi.fn()
        const content: ArticleDocument = [
            { id: '1', type: 'scheduleTable', props: { showDateTabs: true }, children: [] },
        ]

        render(<ArticleEditor content={content} onChange={onChange} />)

        const toggle = await screen.findByRole('switch', { name: '日付タブを出す' })
        expect(toggle).toBeChecked()
        await user.click(toggle)

        expect(await screen.findByText('日付タブ: なし')).toBeInTheDocument()
        expect(onChange).toHaveBeenLastCalledWith([
            expect.objectContaining({ id: '1', type: 'scheduleTable', props: { showDateTabs: false } }),
        ])
    })

    it('マップはカードに説明の一文を出し、カーソルがあればサイドパネルに「設定する項目はありません」と出す', async () => {
        const content: ArticleDocument = [{ id: '1', type: 'map', props: {}, children: [] }]

        render(<ArticleEditor content={content} />)

        expect(await screen.findByText('会場のマップを出します')).toBeInTheDocument()
        expect(screen.getByText('マップ', { selector: 'span' })).toBeInTheDocument()
        const panel = await screen.findByRole('complementary', { name: 'コンポーネントの設定' })
        expect(panel).toHaveTextContent('マップ')
        expect(panel).toHaveTextContent('設定する項目はありません')
    })

    it('カーソルが別のブロックにあれば、マップのサイドパネルを出さない', async () => {
        const content: ArticleDocument = [
            { id: '1', type: 'paragraph', props: defaultBlockProps, content: [], children: [] },
            { id: '2', type: 'map', props: {}, children: [] },
        ]

        render(<ArticleEditor content={content} />)

        expect(await screen.findByText('会場のマップを出します')).toBeInTheDocument()
        expect(screen.getByText('設定')).toBeInTheDocument()
        expect(screen.queryByRole('complementary', { name: 'コンポーネントの設定' })).not.toBeInTheDocument()
    })

    it('注意書きは種類の見出しと本文を出し、子ブロックも同じブロックの中に出す', async () => {
        const content: ArticleDocument = [
            {
                id: '1',
                type: 'callout',
                props: { variant: 'info' },
                content: [{ type: 'text', text: '入場は無料です', styles: {} }],
                children: [
                    {
                        id: '2',
                        type: 'bulletListItem',
                        props: defaultBlockProps,
                        content: [{ type: 'text', text: '再入場できます', styles: {} }],
                        children: [],
                    },
                ],
            },
        ]

        const { container } = render(<ArticleEditor content={content} />)

        expect(await screen.findByText('入場は無料です')).toBeInTheDocument()
        const callout = container.querySelector('[data-callout-variant="info"]')
        expect(callout).toHaveTextContent('情報')
        // 子ブロックは同じ .bn-block の中（枠を付ける要素の中）に入る
        expect(callout?.closest('.bn-block')).toHaveTextContent('再入場できます')
    })

    it('注意書きのアイコンのメニューで種類を選ぶと、variant を変えて onChange に渡す', async () => {
        const user = userEvent.setup()
        const onChange = vi.fn()
        const content: ArticleDocument = [
            {
                id: '1',
                type: 'callout',
                props: { variant: 'caution' },
                content: [{ type: 'text', text: '現金のみです', styles: {} }],
                children: [],
            },
        ]

        render(<ArticleEditor content={content} onChange={onChange} />)

        expect(await screen.findByText('注意', { selector: 'span' })).toBeInTheDocument()
        await user.click(screen.getByRole('button', { name: '注意書きの種類' }))
        // いまの種類にだけチェックを付ける
        expect((await screen.findByRole('menuitem', { name: '注意' })).querySelector('.lucide-check')).not.toBeNull()
        expect(screen.getByRole('menuitem', { name: '警告' }).querySelector('.lucide-check')).toBeNull()
        await user.click(screen.getByRole('menuitem', { name: '警告' }))

        expect(await screen.findByText('警告', { selector: 'span' })).toBeInTheDocument()
        expect(onChange).toHaveBeenLastCalledWith([
            expect.objectContaining({ id: '1', type: 'callout', props: { variant: 'warning' } }),
        ])
    })

    it('模擬店一覧はカードに設定の要約を出す（タグはタグの一覧の順に名前で出す）', async () => {
        const content: ArticleDocument = [
            {
                id: '1',
                type: 'shopList',
                props: {
                    showDateTabs: true,
                    showSearch: true,
                    showSort: false,
                    showTagTabs: true,
                    tags: 'experience,food',
                    showProducts: true,
                },
                children: [],
            },
            {
                id: '2',
                type: 'shopList',
                props: {
                    showDateTabs: false,
                    showSearch: false,
                    showSort: true,
                    showTagTabs: false,
                    tags: '',
                    showProducts: false,
                },
                children: [],
            },
        ]

        render(<ArticleEditor content={content} />)

        expect(await screen.findByText('タグタブ: あり（食べ物・体験）')).toBeInTheDocument()
        expect(screen.getByText('日付タブ: あり')).toBeInTheDocument()
        expect(screen.getByText('検索: あり')).toBeInTheDocument()
        expect(screen.getByText('並び替え: なし')).toBeInTheDocument()
        expect(screen.getByText('カードの商品: あり')).toBeInTheDocument()
        expect(screen.getByText('タグタブ: なし')).toBeInTheDocument()
        expect(screen.getByText('日付タブ: なし')).toBeInTheDocument()
        expect(screen.getByText('カードの商品: なし')).toBeInTheDocument()
    })

    it('模擬店一覧のサイドパネルでスイッチを切り替えると、ブロックの props を変えて onChange に渡す', async () => {
        const user = userEvent.setup()
        const onChange = vi.fn()
        const props = {
            showDateTabs: true,
            showSearch: true,
            showSort: true,
            showTagTabs: true,
            tags: '',
            showProducts: true,
        }
        const content: ArticleDocument = [{ id: '1', type: 'shopList', props, children: [] }]

        render(<ArticleEditor content={content} onChange={onChange} />)

        await user.click(await screen.findByRole('switch', { name: 'カードに商品を出す' }))

        expect(await screen.findByText('カードの商品: なし')).toBeInTheDocument()
        expect(onChange).toHaveBeenLastCalledWith([
            expect.objectContaining({ id: '1', type: 'shopList', props: { ...props, showProducts: false } }),
        ])
    })

    it('商品一覧はカードに表示する商品を出し、選んでいなければ「すべて」と出す', async () => {
        const content: ArticleDocument = [
            { id: '1', type: 'productList', props: { products: 'product-3,product-1' }, children: [] },
            { id: '2', type: 'productList', props: { products: '' }, children: [] },
        ]

        render(<ArticleEditor content={content} />)

        expect(await screen.findByText('表示する商品: レモネード・はちみつレモン')).toBeInTheDocument()
        expect(screen.getByText('表示する商品: すべて')).toBeInTheDocument()
    })

    it('商品一覧のサイドパネルで商品を選ぶと、商品の一覧の順に ID を並べて props に入れる', async () => {
        const user = userEvent.setup()
        const onChange = vi.fn()
        const content: ArticleDocument = [{ id: '1', type: 'productList', props: { products: '' }, children: [] }]

        render(<ArticleEditor content={content} onChange={onChange} />)

        await user.click(await screen.findByRole('checkbox', { name: 'はちみつレモン' }))
        await user.click(screen.getByRole('checkbox', { name: 'レモネード' }))

        expect(await screen.findByText('表示する商品: レモネード・はちみつレモン')).toBeInTheDocument()
        expect(onChange).toHaveBeenLastCalledWith([
            expect.objectContaining({ id: '1', type: 'productList', props: { products: 'product-1,product-3' } }),
        ])
    })

    it('模擬店のサマリーはカードに説明を出し、カーソルがあればサイドパネルに「設定する項目はありません」と出す', async () => {
        const content: ArticleDocument = [{ id: '1', type: 'shopSummary', props: {}, children: [] }]

        render(<ArticleEditor content={content} />)

        expect(
            await screen.findByText('表示中の模擬店の Day・団体・店名・時間・場所と「マップで見る」を出します'),
        ).toBeInTheDocument()
        const panel = await screen.findByRole('complementary', { name: 'コンポーネントの設定' })
        expect(within(panel).getByRole('heading', { name: '模擬店のサマリー' })).toBeInTheDocument()
        expect(within(panel).getByText('設定する項目はありません')).toBeInTheDocument()
    })

    it('マップはカードに説明の一文を出し、カーソルがあればサイドパネルに「設定する項目はありません」と出す', async () => {
        const content: ArticleDocument = [{ id: '1', type: 'map', props: {}, children: [] }]

        render(<ArticleEditor content={content} />)

        expect(await screen.findByText('会場のマップを出します')).toBeInTheDocument()
        expect(screen.getByText('マップ', { selector: 'span' })).toBeInTheDocument()
        const panel = await screen.findByRole('complementary', { name: 'コンポーネントの設定' })
        expect(panel).toHaveTextContent('マップ')
        expect(panel).toHaveTextContent('設定する項目はありません')
    })

    it('カーソルが別のブロックにあれば、マップのサイドパネルを出さない', async () => {
        const content: ArticleDocument = [
            { id: '1', type: 'paragraph', props: defaultBlockProps, content: [], children: [] },
            { id: '2', type: 'map', props: {}, children: [] },
        ]

        render(<ArticleEditor content={content} />)

        expect(await screen.findByText('会場のマップを出します')).toBeInTheDocument()
        expect(screen.getByText('設定')).toBeInTheDocument()
        expect(screen.queryByRole('complementary', { name: 'コンポーネントの設定' })).not.toBeInTheDocument()
    })

    it('注意書きは種類の見出しと本文を出し、子ブロックも同じブロックの中に出す', async () => {
        const content: ArticleDocument = [
            {
                id: '1',
                type: 'callout',
                props: { variant: 'info' },
                content: [{ type: 'text', text: '入場は無料です', styles: {} }],
                children: [
                    {
                        id: '2',
                        type: 'bulletListItem',
                        props: defaultBlockProps,
                        content: [{ type: 'text', text: '再入場できます', styles: {} }],
                        children: [],
                    },
                ],
            },
        ]

        const { container } = render(<ArticleEditor content={content} />)

        expect(await screen.findByText('入場は無料です')).toBeInTheDocument()
        const callout = container.querySelector('[data-callout-variant="info"]')
        expect(callout).toHaveTextContent('情報')
        // 子ブロックは同じ .bn-block の中（枠を付ける要素の中）に入る
        expect(callout?.closest('.bn-block')).toHaveTextContent('再入場できます')
    })

    it('注意書きのアイコンのメニューで種類を選ぶと、variant を変えて onChange に渡す', async () => {
        const user = userEvent.setup()
        const onChange = vi.fn()
        const content: ArticleDocument = [
            {
                id: '1',
                type: 'callout',
                props: { variant: 'caution' },
                content: [{ type: 'text', text: '現金のみです', styles: {} }],
                children: [],
            },
        ]

        render(<ArticleEditor content={content} onChange={onChange} />)

        expect(await screen.findByText('注意', { selector: 'span' })).toBeInTheDocument()
        await user.click(screen.getByRole('button', { name: '注意書きの種類' }))
        // いまの種類にだけチェックを付ける
        expect((await screen.findByRole('menuitem', { name: '注意' })).querySelector('.lucide-check')).not.toBeNull()
        expect(screen.getByRole('menuitem', { name: '警告' }).querySelector('.lucide-check')).toBeNull()
        await user.click(screen.getByRole('menuitem', { name: '警告' }))

        expect(await screen.findByText('警告', { selector: 'span' })).toBeInTheDocument()
        expect(onChange).toHaveBeenLastCalledWith([
            expect.objectContaining({ id: '1', type: 'callout', props: { variant: 'warning' } }),
        ])
    })

    it('出演者一覧はカードに設定の要約を出す（タグはタグの一覧の順に名前で出す）', async () => {
        const content: ArticleDocument = [
            { id: '1', type: 'paragraph', props: defaultBlockProps, content: [], children: [] },
            {
                id: '2',
                type: 'artistList',
                props: {
                    showDateTabs: true,
                    showSearch: true,
                    showSort: false,
                    showTagTabs: true,
                    tags: 'dance,band',
                },
                children: [],
            },
            {
                id: '3',
                type: 'artistList',
                props: {
                    showDateTabs: false,
                    showSearch: false,
                    showSort: true,
                    showTagTabs: true,
                    tags: '',
                },
                children: [],
            },
        ]

        render(<ArticleEditor content={content} />)

        expect(await screen.findByText('タグタブ: あり（バンド・ダンス）')).toBeInTheDocument()
        expect(screen.getByText('タグタブ: あり（タグ未選択）')).toBeInTheDocument()
        expect(screen.getAllByText('日付タブ: あり')).toHaveLength(1)
        expect(screen.getAllByText('検索: なし')).toHaveLength(1)
        expect(screen.getAllByText('並び替え: あり')).toHaveLength(1)
    })

    it('出演者一覧のサイドパネルでスイッチを切り替えると、ブロックの props を変えて onChange に渡す', async () => {
        const user = userEvent.setup()
        const onChange = vi.fn()
        const props = {
            showDateTabs: true,
            showSearch: true,
            showSort: true,
            showTagTabs: true,
            tags: '',
        }
        const content: ArticleDocument = [{ id: '1', type: 'artistList', props, children: [] }]

        render(<ArticleEditor content={content} onChange={onChange} />)

        await user.click(await screen.findByRole('switch', { name: '検索を出す' }))

        expect(await screen.findByText('検索: なし')).toBeInTheDocument()
        expect(onChange).toHaveBeenLastCalledWith([
            expect.objectContaining({ id: '1', type: 'artistList', props: { ...props, showSearch: false } }),
        ])
    })

    it('出演者のサマリー・セットリストはカードに説明を出し、選択中はサイドパネルに「設定する項目はありません」と出す', async () => {
        const content: ArticleDocument = [
            { id: '1', type: 'artistSummary', props: {}, children: [] },
            { id: '2', type: 'setList', props: {}, children: [] },
        ]

        render(<ArticleEditor content={content} />)

        expect(
            await screen.findByText(
                '表示中の出演者の Day・団体・演目・出演日時・会場・人数と、スケジュール・マップへのボタンを出します',
            ),
        ).toBeInTheDocument()
        expect(screen.getByText('表示中の出演者のセットリストを出します')).toBeInTheDocument()
        // 開いた直後はカーソルが先頭のブロック（出演者のサマリー）にある
        const panel = await screen.findByRole('complementary', { name: 'コンポーネントの設定' })
        expect(within(panel).getByRole('heading', { name: '出演者のサマリー' })).toBeInTheDocument()
        expect(within(panel).getByText('設定する項目はありません')).toBeInTheDocument()
    })

    it('天気のブロックは、カードに名前と説明の1文を出す', async () => {
        const content: ArticleDocument = [
            { id: '1', type: 'paragraph', props: defaultBlockProps, content: [], children: [] },
            { id: '2', type: 'todayWeather', props: {}, children: [] },
            { id: '3', type: 'weeklyForecast', props: {}, children: [] },
            { id: '4', type: 'weatherAlert', props: {}, children: [] },
            { id: '5', type: 'wbgt', props: {}, children: [] },
            { id: '6', type: 'weatherOverview', props: {}, children: [] },
            { id: '7', type: 'weatherCredit', props: {}, children: [] },
        ]

        render(<ArticleEditor content={content} />)

        for (const [name, description] of [
            ['今日の天気', '今日の天気と気温を出します'],
            ['週間予報', '1週間分の天気と気温を横に並べて出します'],
            ['気象警報・注意報', '発表中の警報・注意報を出します（無いときは出しません）'],
            ['暑さ指数', '暑さ指数（WBGT）と段階を出します'],
            ['天気概況', '気象台の天気概況の文章を出します'],
            ['天気の更新時刻・出典', '天気の更新時刻と出典（気象庁）を出します'],
        ]) {
            expect(await screen.findByText(name!, { selector: 'span' })).toBeInTheDocument()
            expect(screen.getByText(description!)).toBeInTheDocument()
        }
        expect(screen.queryByRole('complementary', { name: 'コンポーネントの設定' })).not.toBeInTheDocument()
    })

    it('カーソルが天気のブロックにあれば、サイドパネルに名前と「設定する項目はありません」を出す', async () => {
        const content: ArticleDocument = [{ id: '1', type: 'wbgt', props: {}, children: [] }]

        render(<ArticleEditor content={content} />)

        const panel = await screen.findByRole('complementary', { name: 'コンポーネントの設定' })
        expect(within(panel).getByRole('heading', { name: '暑さ指数' })).toBeInTheDocument()
        expect(within(panel).getByText('設定する項目はありません')).toBeInTheDocument()
        expect(within(panel).queryByRole('textbox')).not.toBeInTheDocument()
    })

    it('スケジュール表はカードに設定の要約（日付タブの有無）だけを出す', async () => {
        const content: ArticleDocument = [
            { id: '1', type: 'scheduleTable', props: { showDateTabs: true }, children: [] },
            { id: '2', type: 'scheduleTable', props: { showDateTabs: false }, children: [] },
        ]

        render(<ArticleEditor content={content} />)

        expect(await screen.findByText('日付タブ: あり')).toBeInTheDocument()
        expect(screen.getByText('日付タブ: なし')).toBeInTheDocument()
        expect(screen.getAllByText('スケジュール表', { selector: 'span' }).length).toBeGreaterThanOrEqual(2)
    })

    it('スケジュール表のサイドパネルでスイッチを切り替えると、ブロックの props を変えて onChange に渡す', async () => {
        const user = userEvent.setup()
        const onChange = vi.fn()
        const content: ArticleDocument = [
            { id: '1', type: 'scheduleTable', props: { showDateTabs: true }, children: [] },
        ]

        render(<ArticleEditor content={content} onChange={onChange} />)

        const toggle = await screen.findByRole('switch', { name: '日付タブを出す' })
        expect(toggle).toBeChecked()
        await user.click(toggle)

        expect(await screen.findByText('日付タブ: なし')).toBeInTheDocument()
        expect(onChange).toHaveBeenLastCalledWith([
            expect.objectContaining({ id: '1', type: 'scheduleTable', props: { showDateTabs: false } }),
        ])
    })

    it('マップはカードに説明の一文を出し、カーソルがあればサイドパネルに「設定する項目はありません」と出す', async () => {
        const content: ArticleDocument = [{ id: '1', type: 'map', props: {}, children: [] }]

        render(<ArticleEditor content={content} />)

        expect(await screen.findByText('会場のマップを出します')).toBeInTheDocument()
        expect(screen.getByText('マップ', { selector: 'span' })).toBeInTheDocument()
        const panel = await screen.findByRole('complementary', { name: 'コンポーネントの設定' })
        expect(panel).toHaveTextContent('マップ')
        expect(panel).toHaveTextContent('設定する項目はありません')
    })

    it('カーソルが別のブロックにあれば、マップのサイドパネルを出さない', async () => {
        const content: ArticleDocument = [
            { id: '1', type: 'paragraph', props: defaultBlockProps, content: [], children: [] },
            { id: '2', type: 'map', props: {}, children: [] },
        ]

        render(<ArticleEditor content={content} />)

        expect(await screen.findByText('会場のマップを出します')).toBeInTheDocument()
        expect(screen.getByText('設定')).toBeInTheDocument()
        expect(screen.queryByRole('complementary', { name: 'コンポーネントの設定' })).not.toBeInTheDocument()
    })

    it('注意書きは種類の見出しと本文を出し、子ブロックも同じブロックの中に出す', async () => {
        const content: ArticleDocument = [
            {
                id: '1',
                type: 'callout',
                props: { variant: 'info' },
                content: [{ type: 'text', text: '入場は無料です', styles: {} }],
                children: [
                    {
                        id: '2',
                        type: 'bulletListItem',
                        props: defaultBlockProps,
                        content: [{ type: 'text', text: '再入場できます', styles: {} }],
                        children: [],
                    },
                ],
            },
        ]

        const { container } = render(<ArticleEditor content={content} />)

        expect(await screen.findByText('入場は無料です')).toBeInTheDocument()
        const callout = container.querySelector('[data-callout-variant="info"]')
        expect(callout).toHaveTextContent('情報')
        // 子ブロックは同じ .bn-block の中（枠を付ける要素の中）に入る
        expect(callout?.closest('.bn-block')).toHaveTextContent('再入場できます')
    })

    it('注意書きのアイコンのメニューで種類を選ぶと、variant を変えて onChange に渡す', async () => {
        const user = userEvent.setup()
        const onChange = vi.fn()
        const content: ArticleDocument = [
            {
                id: '1',
                type: 'callout',
                props: { variant: 'caution' },
                content: [{ type: 'text', text: '現金のみです', styles: {} }],
                children: [],
            },
        ]

        render(<ArticleEditor content={content} onChange={onChange} />)

        expect(await screen.findByText('注意', { selector: 'span' })).toBeInTheDocument()
        await user.click(screen.getByRole('button', { name: '注意書きの種類' }))
        // いまの種類にだけチェックを付ける
        expect((await screen.findByRole('menuitem', { name: '注意' })).querySelector('.lucide-check')).not.toBeNull()
        expect(screen.getByRole('menuitem', { name: '警告' }).querySelector('.lucide-check')).toBeNull()
        await user.click(screen.getByRole('menuitem', { name: '警告' }))

        expect(await screen.findByText('警告', { selector: 'span' })).toBeInTheDocument()
        expect(onChange).toHaveBeenLastCalledWith([
            expect.objectContaining({ id: '1', type: 'callout', props: { variant: 'warning' } }),
        ])
    })

    it('コードブロック（裏機能）の中身を<pre><code>で表示する', async () => {
        const content: ArticleDocument = [
            {
                id: '1',
                type: 'codeBlock',
                props: { language: 'typescript' },
                content: [{ type: 'text', text: 'const x = 1', styles: {} }],
                children: [],
            },
        ]

        render(<ArticleEditor content={content} />)

        const code = await screen.findByText((text) => text.includes('const x = 1'), { selector: 'code' })
        expect(code.closest('pre')).toBeInTheDocument()
        // シンタックスハイライトはShikiの非同期・WASM読み込みに依存するため、
        // 実際の色付けの検証はPlaywright（実ブラウザ）での手動確認で担保している
    })
})
