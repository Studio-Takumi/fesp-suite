import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import type { ArticleDocument } from '@fesp/schema'

import { ArticleEditor, articleSchema } from './article-editor'

const defaultBlockProps = { backgroundColor: 'default', textColor: 'default', textAlignment: 'left' } as const

describe('articleSchema', () => {
    it('テキスト・見出し・リストの4種類のブロックだけを許可する（画像・テーブル等は含まない）', () => {
        expect(Object.keys(articleSchema.blockSchema).sort()).toEqual(
            ['bulletListItem', 'heading', 'numberedListItem', 'paragraph'].sort(),
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
        ]

        render(<ArticleEditor content={content} />)

        expect(await screen.findByText('今日の模擬店')).toBeInTheDocument()
        expect(await screen.findByText('たこ焼き')).toBeInTheDocument()
    })
})
