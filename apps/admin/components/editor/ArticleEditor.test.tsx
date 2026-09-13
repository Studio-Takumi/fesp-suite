import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import type { ArticleDocument } from '@fesp/schema'

import { ArticleEditor, articleSchema } from './ArticleEditor'

const defaultBlockProps = { backgroundColor: 'default', textColor: 'default', textAlignment: 'left' } as const

describe('articleSchema', () => {
    it('テキスト・見出し・リスト・チェックリスト・トグルリスト・引用・区切り線・表・コードブロックだけを許可する（画像・動画等は含まない）', () => {
        expect(Object.keys(articleSchema.blockSchema).sort()).toEqual(
            [
                'bulletListItem',
                'checkListItem',
                'codeBlock',
                'divider',
                'heading',
                'numberedListItem',
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

    it('リンクを含む記事を表示する', async () => {
        const content: ArticleDocument = [
            {
                id: '1',
                type: 'paragraph',
                props: defaultBlockProps,
                content: [
                    {
                        type: 'link',
                        href: 'https://example.com',
                        content: [{ type: 'text', text: '公式サイト', styles: {} }],
                    },
                ],
                children: [],
            },
        ]

        render(<ArticleEditor content={content} />)

        const link = await screen.findByRole('link', { name: '公式サイト' })
        expect(link).toHaveAttribute('href', 'https://example.com')
    })
})
