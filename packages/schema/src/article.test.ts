import { describe, expect, it } from 'vitest'

import { articleDocumentSchema } from './article'

const defaultBlockProps = { backgroundColor: 'default', textColor: 'default', textAlignment: 'left' } as const

describe('articleDocumentSchema', () => {
    it('見出し・段落・リストを含む記事を受理する', () => {
        const result = articleDocumentSchema.safeParse([
            {
                id: '1',
                type: 'heading',
                props: { ...defaultBlockProps, level: 2 },
                content: [{ type: 'text', text: '今日の模擬店', styles: {} }],
                children: [],
            },
            {
                id: '2',
                type: 'paragraph',
                props: defaultBlockProps,
                content: [{ type: 'text', text: '現金のみです。', styles: { bold: true } }],
                children: [],
            },
            {
                id: '3',
                type: 'bulletListItem',
                props: defaultBlockProps,
                content: [{ type: 'text', text: 'たこ焼き', styles: {} }],
                children: [],
            },
            {
                id: '4',
                type: 'bulletListItem',
                props: defaultBlockProps,
                content: [{ type: 'text', text: '焼きそば', styles: {} }],
                children: [],
            },
        ])

        expect(result.success).toBe(true)
    })

    it('空の段落だけの記事（新規作成時の初期状態）を受理する', () => {
        const result = articleDocumentSchema.safeParse([
            { id: '1', type: 'paragraph', props: defaultBlockProps, content: [], children: [] },
        ])

        expect(result.success).toBe(true)
    })

    it('childrenでネストしたリストを受理する', () => {
        const result = articleDocumentSchema.safeParse([
            {
                id: '1',
                type: 'numberedListItem',
                props: { ...defaultBlockProps, start: 1 },
                content: [{ type: 'text', text: '準備', styles: {} }],
                children: [
                    {
                        id: '2',
                        type: 'bulletListItem',
                        props: defaultBlockProps,
                        content: [{ type: 'text', text: '設営', styles: {} }],
                        children: [],
                    },
                ],
            },
        ])

        expect(result.success).toBe(true)
    })

    it('リンクを受理する', () => {
        const result = articleDocumentSchema.safeParse([
            {
                id: '1',
                type: 'paragraph',
                props: defaultBlockProps,
                content: [
                    {
                        type: 'link',
                        href: 'https://example.com',
                        content: [{ type: 'text', text: '詳しくはこちら', styles: {} }],
                    },
                ],
                children: [],
            },
        ])

        expect(result.success).toBe(true)
    })

    it('未対応のブロック種別（独自コンポーネントは#24で対応）は拒否する', () => {
        const result = articleDocumentSchema.safeParse([
            { id: '1', type: 'shopList', props: { day: 1 }, content: undefined, children: [] },
        ])

        expect(result.success).toBe(false)
    })

    it('見出しレベルが対象外（1〜6以外）なら拒否する', () => {
        const result = articleDocumentSchema.safeParse([
            {
                id: '1',
                type: 'heading',
                props: { ...defaultBlockProps, level: 7 },
                content: [{ type: 'text', text: '見出し', styles: {} }],
                children: [],
            },
        ])

        expect(result.success).toBe(false)
    })

    it('未定義の色（textColor）は拒否する', () => {
        const result = articleDocumentSchema.safeParse([
            {
                id: '1',
                type: 'paragraph',
                props: { ...defaultBlockProps, textColor: 'rainbow' },
                content: [],
                children: [],
            },
        ])

        expect(result.success).toBe(false)
    })

    it('ルートが配列でなければ拒否する（BlockNoteはdocラッパーを持たない）', () => {
        const result = articleDocumentSchema.safeParse({ type: 'doc', content: [] })

        expect(result.success).toBe(false)
    })
})
