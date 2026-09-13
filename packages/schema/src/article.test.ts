import { describe, expect, it } from 'vitest'

import { articleDocumentSchema } from './article'

describe('articleDocumentSchema', () => {
    it('見出し・段落・リストを含む記事を受理する', () => {
        const result = articleDocumentSchema.safeParse({
            type: 'doc',
            content: [
                {
                    type: 'heading',
                    attrs: { level: 2 },
                    content: [{ type: 'text', text: '今日の模擬店' }],
                },
                {
                    type: 'paragraph',
                    content: [{ type: 'text', text: '現金のみです。', marks: [{ type: 'bold' }] }],
                },
                {
                    type: 'bulletList',
                    content: [
                        {
                            type: 'listItem',
                            content: [{ type: 'paragraph', content: [{ type: 'text', text: 'たこ焼き' }] }],
                        },
                        {
                            type: 'listItem',
                            content: [{ type: 'paragraph', content: [{ type: 'text', text: '焼きそば' }] }],
                        },
                    ],
                },
            ],
        })

        expect(result.success).toBe(true)
    })

    it('空の段落だけの記事（新規作成時の初期状態）を受理する', () => {
        const result = articleDocumentSchema.safeParse({
            type: 'doc',
            content: [{ type: 'paragraph' }],
        })

        expect(result.success).toBe(true)
    })

    it('ネストしたリストを受理する', () => {
        const result = articleDocumentSchema.safeParse({
            type: 'doc',
            content: [
                {
                    type: 'orderedList',
                    attrs: { start: 1 },
                    content: [
                        {
                            type: 'listItem',
                            content: [
                                { type: 'paragraph', content: [{ type: 'text', text: '準備' }] },
                                {
                                    type: 'bulletList',
                                    content: [
                                        {
                                            type: 'listItem',
                                            content: [{ type: 'paragraph', content: [{ type: 'text', text: '設営' }] }],
                                        },
                                    ],
                                },
                            ],
                        },
                    ],
                },
            ],
        })

        expect(result.success).toBe(true)
    })

    it('未知のノード種別は拒否する（独自コンポーネントノードは#24で対応）', () => {
        const result = articleDocumentSchema.safeParse({
            type: 'doc',
            content: [{ type: 'component', attrs: { name: 'shopList', props: {} } }],
        })

        expect(result.success).toBe(false)
    })

    it('見出しレベルが対象外（1〜3以外）なら拒否する', () => {
        const result = articleDocumentSchema.safeParse({
            type: 'doc',
            content: [{ type: 'heading', attrs: { level: 4 }, content: [{ type: 'text', text: '見出し' }] }],
        })

        expect(result.success).toBe(false)
    })

    it('doc 自体でなければ拒否する', () => {
        const result = articleDocumentSchema.safeParse({ type: 'paragraph', content: [] })

        expect(result.success).toBe(false)
    })
})
