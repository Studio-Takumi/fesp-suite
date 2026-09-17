import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import type { ArticleDocument } from '@fesp/schema'

import { ArticleEditor, articleSchema } from './ArticleEditor'

const defaultBlockProps = { backgroundColor: 'default', textColor: 'default', textAlignment: 'left' } as const

describe('articleSchema', () => {
    it('テキスト・見出し・リスト・チェックリスト・トグルリスト・引用・区切り線・表・コードブロックと、独自コンポーネントのページ見出し・スケジュール表だけを許可する（画像・動画等は含まない）', () => {
        expect(Object.keys(articleSchema.blockSchema).sort()).toEqual(
            [
                'bulletListItem',
                'checkListItem',
                'codeBlock',
                'divider',
                'heading',
                'numberedListItem',
                'pageHeader',
                'paragraph',
                'quote',
                'scheduleTable',
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
