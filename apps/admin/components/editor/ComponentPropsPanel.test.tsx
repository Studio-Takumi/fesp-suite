import type { ReactNode } from 'react'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render as rtlRender, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import { weatherComponentTypes } from '@fesp/schema'

import { ComponentPropsPanel, isComponentBlock } from './ComponentPropsPanel'

// お知らせ一覧のフォームが lib/queries.ts を読むので、env と API クライアントを差し替える
vi.mock('~/lib/env', () => ({ env: { NEXT_PUBLIC_EVENT_ID: '0b7e6d5c-4a3b-4c2d-9e1f-a2b3c4d5e6f7' } }))
vi.mock('~/lib/api', () => ({ adminFetch: vi.fn() }))

/** お知らせ一覧のフォームがタグの仮データを TanStack Query で読むので、QueryClient の中で描画する */
function render(ui: ReactNode) {
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
    return rtlRender(<QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>)
}

describe('isComponentBlock', () => {
    it('独自コンポーネントのブロックだけを true にする', () => {
        for (const type of [
            'pageHeader',
            'scheduleTable',
            'map',
            'newsList',
            'coverImage',
            'postSummary',
            'adjacentPosts',
            'mainHero',
            'weatherBar',
            'contentList',
        ]) {
            expect(isComponentBlock({ type })).toBe(true)
        }
        for (const type of weatherComponentTypes) expect(isComponentBlock({ type })).toBe(true)
        expect(isComponentBlock({ type: 'paragraph' })).toBe(false)
    })
})

describe('ComponentPropsPanel（ページ見出し）', () => {
    const block = { id: '1', type: 'pageHeader', props: { label: 'NEWS', title: 'お知らせ' } } as const

    it('コンポーネント名と、ブロックの props を初期値にした入力欄を出す', () => {
        render(<ComponentPropsPanel block={block} onChange={vi.fn()} />)

        expect(screen.getByRole('complementary', { name: 'コンポーネントの設定' })).toBeInTheDocument()
        expect(screen.getByRole('heading', { name: 'ページ見出し' })).toBeInTheDocument()
        expect(screen.getByLabelText('英語ラベル')).toHaveValue('NEWS')
        expect(screen.getByLabelText('日本語タイトル')).toHaveValue('お知らせ')
    })

    it('入力するたびに props を渡す', async () => {
        const user = userEvent.setup()
        const onChange = vi.fn()
        render(<ComponentPropsPanel block={block} onChange={onChange} />)

        await user.clear(screen.getByLabelText('日本語タイトル'))
        await user.type(screen.getByLabelText('日本語タイトル'), 'ブログ')

        expect(onChange).toHaveBeenLastCalledWith({ label: 'NEWS', title: 'ブログ' })
    })

    it('文字数を超えたら入力欄の下にエラーを出し、props を渡さない', async () => {
        const user = userEvent.setup()
        const onChange = vi.fn()
        render(
            <ComponentPropsPanel
                block={{ ...block, props: { label: 'A'.repeat(30), title: 'あ'.repeat(50) } }}
                onChange={onChange}
            />,
        )

        await user.type(screen.getByLabelText('英語ラベル'), 'B')
        expect(await screen.findByText('英語ラベルは30文字以内で入力してください')).toBeInTheDocument()
        expect(screen.getByLabelText('英語ラベル')).toHaveAttribute('aria-invalid', 'true')

        await user.type(screen.getByLabelText('日本語タイトル'), 'い')
        expect(await screen.findByText('日本語タイトルは50文字以内で入力してください')).toBeInTheDocument()

        expect(onChange).not.toHaveBeenCalled()
    })
})

describe('ComponentPropsPanel（スケジュール表）', () => {
    const block = { id: '1', type: 'scheduleTable', props: { showDateTabs: false } } as const

    it('コンポーネント名と、ブロックの props を初期値にしたスイッチを出す', () => {
        render(<ComponentPropsPanel block={block} onChange={vi.fn()} />)

        expect(screen.getByRole('heading', { name: 'スケジュール表' })).toBeInTheDocument()
        expect(screen.getByRole('switch', { name: '日付タブを出す' })).not.toBeChecked()
    })

    it('スイッチを切り替えるたびに props を渡す', async () => {
        const user = userEvent.setup()
        const onChange = vi.fn()
        render(<ComponentPropsPanel block={block} onChange={onChange} />)

        await user.click(screen.getByRole('switch', { name: '日付タブを出す' }))
        expect(onChange).toHaveBeenLastCalledWith({ showDateTabs: true })

        await user.click(screen.getByRole('switch', { name: '日付タブを出す' }))
        expect(onChange).toHaveBeenLastCalledWith({ showDateTabs: false })
    })
})

describe('ComponentPropsPanel（マップ）', () => {
    it('props を持たないので、コンポーネント名の下に「設定する項目はありません」と出し、入力欄を出さない', () => {
        render(<ComponentPropsPanel block={{ id: '1', type: 'map', props: {} }} onChange={vi.fn()} />)

        const panel = screen.getByRole('complementary', { name: 'コンポーネントの設定' })
        expect(screen.getByRole('heading', { name: 'マップ' })).toBeInTheDocument()
        expect(panel).toHaveTextContent('設定する項目はありません')
        expect(screen.queryByRole('textbox')).not.toBeInTheDocument()
    })
})

describe('ComponentPropsPanel（お知らせ一覧）', () => {
    const block = {
        id: '1',
        type: 'newsList',
        props: { showTagTabs: true, tags: 'shop', limit: 3, showViewAll: false },
    } as const

    it('コンポーネント名と、ブロックの props を初期値にした入力欄を出す', async () => {
        render(<ComponentPropsPanel block={block} onChange={vi.fn()} />)

        expect(screen.getByRole('heading', { name: 'お知らせ一覧' })).toBeInTheDocument()
        expect(screen.getByRole('switch', { name: 'タグタブを出す' })).toBeChecked()
        expect(await screen.findByRole('checkbox', { name: '模擬店' })).toBeChecked()
        expect(screen.getByRole('checkbox', { name: 'ステージ' })).not.toBeChecked()
        expect(screen.getByLabelText('表示件数')).toHaveValue(3)
        expect(screen.getByRole('switch', { name: '「すべて見る」を出す' })).not.toBeChecked()
    })

    it('タグを選ぶと、タグの一覧の順に ID をカンマ区切りにして渡す', async () => {
        const user = userEvent.setup()
        const onChange = vi.fn()
        render(<ComponentPropsPanel block={block} onChange={onChange} />)

        await user.click(await screen.findByRole('checkbox', { name: 'ステージ' }))
        expect(onChange).toHaveBeenLastCalledWith({ ...block.props, tags: 'stage,shop' })

        await user.click(screen.getByRole('checkbox', { name: '模擬店' }))
        expect(onChange).toHaveBeenLastCalledWith({ ...block.props, tags: 'stage' })
    })

    it('スイッチを切り替えると渡し、タグタブを出さない間はタグを選べない', async () => {
        const user = userEvent.setup()
        const onChange = vi.fn()
        render(<ComponentPropsPanel block={block} onChange={onChange} />)

        await user.click(screen.getByRole('switch', { name: 'タグタブを出す' }))
        expect(onChange).toHaveBeenLastCalledWith({ ...block.props, showTagTabs: false })
        expect(await screen.findByRole('checkbox', { name: '模擬店' })).toBeDisabled()

        await user.click(screen.getByRole('switch', { name: '「すべて見る」を出す' }))
        expect(onChange).toHaveBeenLastCalledWith({ ...block.props, showTagTabs: false, showViewAll: true })
    })

    it('表示件数が1以上の整数でなければエラーを出して props を渡さず、空にすると表示件数を消して渡す', async () => {
        const user = userEvent.setup()
        const onChange = vi.fn()
        render(<ComponentPropsPanel block={block} onChange={onChange} />)

        await user.clear(screen.getByLabelText('表示件数'))
        expect(onChange).toHaveBeenLastCalledWith({ showTagTabs: true, tags: 'shop', showViewAll: false })

        onChange.mockClear()
        await user.type(screen.getByLabelText('表示件数'), '0')
        expect(await screen.findByText('表示件数は1以上の整数で入力してください')).toBeInTheDocument()
        expect(screen.getByLabelText('表示件数')).toHaveAttribute('aria-invalid', 'true')
        expect(onChange).not.toHaveBeenCalled()
    })
})

describe('ComponentPropsPanel（記事の画像）', () => {
    const block = { id: '1', type: 'coverImage', props: { imageUrl: '' } } as const

    it('URL を入れると props を渡し、URL の形でなければエラーを出して渡さない', async () => {
        const user = userEvent.setup()
        const onChange = vi.fn()
        render(<ComponentPropsPanel block={block} onChange={onChange} />)

        expect(screen.getByRole('heading', { name: '記事の画像' })).toBeInTheDocument()

        await user.type(screen.getByLabelText('画像の URL'), 'cover.jpg')
        expect(await screen.findByText('http:// か https:// で始まる URL を入力してください')).toBeInTheDocument()
        expect(onChange).not.toHaveBeenCalled()

        await user.clear(screen.getByLabelText('画像の URL'))
        await user.type(screen.getByLabelText('画像の URL'), 'https://example.com/cover.jpg')
        expect(onChange).toHaveBeenLastCalledWith({ imageUrl: 'https://example.com/cover.jpg' })
    })
})

describe('ComponentPropsPanel（メインスライダー）', () => {
    const block = {
        id: '1',
        type: 'mainHero',
        props: { slides: 'https://example.com/1.jpg|第42回 あおば祭|あおば祭へ、ようこそ' },
    } as const

    it('コンポーネント名と、スライドごとの入力欄を出す', () => {
        render(<ComponentPropsPanel block={block} onChange={vi.fn()} />)

        expect(screen.getByRole('heading', { name: 'メインスライダー' })).toBeInTheDocument()
        const slide = within(screen.getByRole('group', { name: '1枚目' }))
        expect(slide.getByLabelText('画像の URL')).toHaveValue('https://example.com/1.jpg')
        expect(slide.getByLabelText('キャッチ')).toHaveValue('第42回 あおば祭')
        expect(slide.getByLabelText('タイトル')).toHaveValue('あおば祭へ、ようこそ')
    })

    it('入力すると、1行1枚の文字列にして props を渡す', async () => {
        const user = userEvent.setup()
        const onChange = vi.fn()
        render(<ComponentPropsPanel block={block} onChange={onChange} />)

        const slide = within(screen.getByRole('group', { name: '1枚目' }))
        await user.clear(slide.getByLabelText('タイトル'))
        await user.type(slide.getByLabelText('タイトル'), 'ようこそ')

        expect(onChange).toHaveBeenLastCalledWith({
            slides: 'https://example.com/1.jpg|第42回 あおば祭|ようこそ',
        })
    })

    it('スライドを足して入力すると2枚になり、削除すると消える', async () => {
        const user = userEvent.setup()
        const onChange = vi.fn()
        render(<ComponentPropsPanel block={block} onChange={onChange} />)

        await user.click(screen.getByRole('button', { name: 'スライドを追加' }))
        const added = within(screen.getByRole('group', { name: '2枚目' }))
        await user.type(added.getByLabelText('画像の URL'), 'https://example.com/2.jpg')

        expect(onChange).toHaveBeenLastCalledWith({
            slides: 'https://example.com/1.jpg|第42回 あおば祭|あおば祭へ、ようこそ\nhttps://example.com/2.jpg||',
        })

        await user.click(within(screen.getByRole('group', { name: '2枚目' })).getByRole('button', { name: '削除' }))

        expect(onChange).toHaveBeenLastCalledWith({
            slides: 'https://example.com/1.jpg|第42回 あおば祭|あおば祭へ、ようこそ',
        })
        expect(screen.queryByRole('group', { name: '2枚目' })).not.toBeInTheDocument()
    })

    it('URL の形でない・文字数を超えるときはエラーを出し、props を渡さない', async () => {
        const user = userEvent.setup()
        const onChange = vi.fn()
        render(<ComponentPropsPanel block={block} onChange={onChange} />)

        const slide = within(screen.getByRole('group', { name: '1枚目' }))
        await user.clear(slide.getByLabelText('画像の URL'))
        await user.type(slide.getByLabelText('画像の URL'), 'hero.jpg')
        expect(await screen.findByText('http:// か https:// で始まる URL を入力してください')).toBeInTheDocument()
        expect(slide.getByLabelText('画像の URL')).toHaveAttribute('aria-invalid', 'true')

        onChange.mockClear()
        await user.type(slide.getByLabelText('キャッチ'), 'あ'.repeat(30))
        expect(await screen.findByText('キャッチは30文字以内で入力してください')).toBeInTheDocument()
        expect(onChange).not.toHaveBeenCalled()
    })
})

describe('ComponentPropsPanel（その他のコンテンツ）', () => {
    const block = { id: '1', type: 'contentList', props: { links: 'スケジュール|calendar-days|/schedule' } } as const

    it('コンポーネント名と、リンクごとの入力欄を出す', () => {
        render(<ComponentPropsPanel block={block} onChange={vi.fn()} />)

        expect(screen.getByRole('heading', { name: 'その他のコンテンツ' })).toBeInTheDocument()
        const link = within(screen.getByRole('group', { name: '1件目' }))
        expect(link.getByLabelText('表示名')).toHaveValue('スケジュール')
        expect(link.getByLabelText('リンク先')).toHaveValue('/schedule')
        expect(link.getByLabelText('アイコン')).toHaveTextContent('カレンダー')
    })

    it('アイコンを選び直すと、1行1件の文字列にして props を渡す', async () => {
        const user = userEvent.setup()
        const onChange = vi.fn()
        render(<ComponentPropsPanel block={block} onChange={onChange} />)

        await user.click(within(screen.getByRole('group', { name: '1件目' })).getByLabelText('アイコン'))
        await user.click(await screen.findByRole('option', { name: '地図' }))

        expect(onChange).toHaveBeenLastCalledWith({ links: 'スケジュール|map|/schedule' })
    })

    it('リンクを足して入力すると2件になり、削除すると消える', async () => {
        const user = userEvent.setup()
        const onChange = vi.fn()
        render(<ComponentPropsPanel block={block} onChange={onChange} />)

        await user.click(screen.getByRole('button', { name: 'リンクを追加' }))
        const added = within(screen.getByRole('group', { name: '2件目' }))
        await user.type(added.getByLabelText('表示名'), 'マップ')
        await user.type(added.getByLabelText('リンク先'), '/map')

        expect(onChange).toHaveBeenLastCalledWith({
            links: 'スケジュール|calendar-days|/schedule\nマップ|calendar-days|/map',
        })

        await user.click(within(screen.getByRole('group', { name: '2件目' })).getByRole('button', { name: '削除' }))

        expect(onChange).toHaveBeenLastCalledWith({ links: 'スケジュール|calendar-days|/schedule' })
    })

    it('リンク先の形が違う・表示名が長すぎるときはエラーを出し、props を渡さない', async () => {
        const user = userEvent.setup()
        const onChange = vi.fn()
        render(<ComponentPropsPanel block={block} onChange={onChange} />)

        const link = within(screen.getByRole('group', { name: '1件目' }))
        await user.clear(link.getByLabelText('リンク先'))
        await user.type(link.getByLabelText('リンク先'), 'schedule')
        expect(
            await screen.findByText('「/」で始まるページのパスか、http:// か https:// で始まる URL を入力してください'),
        ).toBeInTheDocument()

        onChange.mockClear()
        await user.type(link.getByLabelText('表示名'), 'あ'.repeat(20))
        expect(await screen.findByText('表示名は20文字以内で入力してください')).toBeInTheDocument()
        expect(onChange).not.toHaveBeenCalled()
    })
})

describe('ComponentPropsPanel（props を持たないコンポーネント）', () => {
    it('コンポーネント名の下に「設定する項目はありません」と出す', () => {
        const { rerender } = render(
            <ComponentPropsPanel block={{ id: '1', type: 'postSummary', props: {} }} onChange={vi.fn()} />,
        )
        expect(screen.getByRole('heading', { name: '記事のサマリー' })).toBeInTheDocument()
        expect(screen.getByText('設定する項目はありません')).toBeInTheDocument()
        expect(screen.queryByRole('textbox')).not.toBeInTheDocument()

        rerender(<ComponentPropsPanel block={{ id: '2', type: 'adjacentPosts', props: {} }} onChange={vi.fn()} />)
        expect(screen.getByRole('heading', { name: '前後の記事' })).toBeInTheDocument()
        expect(screen.getByText('設定する項目はありません')).toBeInTheDocument()
    })

    it.each([
        ['todayWeather', '今日の天気'],
        ['weeklyForecast', '週間予報'],
        ['weatherAlert', '気象警報・注意報'],
        ['wbgt', '暑さ指数'],
        ['weatherOverview', '天気概況'],
        ['weatherCredit', '天気の更新時刻・出典'],
    ] as const)(
        '%s はコンポーネント名「%s」の下に「設定する項目はありません」と出し、入力欄を出さない',
        (type, name) => {
            render(<ComponentPropsPanel block={{ id: '1', type, props: {} }} onChange={vi.fn()} />)

            expect(screen.getByRole('heading', { name })).toBeInTheDocument()
            expect(screen.getByText('設定する項目はありません')).toBeInTheDocument()
            expect(screen.queryByRole('textbox')).not.toBeInTheDocument()
        },
    )
})
