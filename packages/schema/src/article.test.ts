import { describe, expect, it } from 'vitest'

import { articleDocumentSchema, articleInputSchema, articleListQuerySchema, articleResponseSchema } from './article'

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

    it('チェックリスト・トグルリスト・引用・区切り線・表を受理する', () => {
        const result = articleDocumentSchema.safeParse([
            {
                id: '1',
                type: 'checkListItem',
                props: { ...defaultBlockProps, checked: true },
                content: [{ type: 'text', text: '設営完了', styles: {} }],
                children: [],
            },
            {
                id: '2',
                type: 'toggleListItem',
                props: defaultBlockProps,
                content: [{ type: 'text', text: '詳細', styles: {} }],
                children: [
                    {
                        id: '2-1',
                        type: 'paragraph',
                        props: defaultBlockProps,
                        content: [{ type: 'text', text: '中身', styles: {} }],
                        children: [],
                    },
                ],
            },
            {
                id: '3',
                type: 'quote',
                props: { backgroundColor: 'default', textColor: 'default' },
                content: [{ type: 'text', text: '雨天でも開催します', styles: {} }],
                children: [],
            },
            {
                id: '4',
                type: 'divider',
                props: {},
                content: undefined,
                children: [],
            },
            {
                id: '5',
                type: 'table',
                props: { textColor: 'default' },
                content: {
                    type: 'tableContent',
                    columnWidths: [undefined, undefined],
                    rows: [
                        {
                            cells: [
                                {
                                    type: 'tableCell',
                                    props: { ...defaultBlockProps },
                                    content: [{ type: 'text', text: '模擬店', styles: {} }],
                                },
                                {
                                    type: 'tableCell',
                                    props: { ...defaultBlockProps },
                                    content: [{ type: 'text', text: '会場', styles: {} }],
                                },
                            ],
                        },
                    ],
                },
                children: [],
            },
        ])

        expect(result.success).toBe(true)
    })

    it('JSONを経由した区切り線（contentキーが消える）・表（列幅がnullになる）を受理する', () => {
        const document = [
            {
                id: '1',
                type: 'divider',
                props: {},
                content: undefined,
                children: [],
            },
            {
                id: '2',
                type: 'table',
                props: { textColor: 'default' },
                content: {
                    type: 'tableContent',
                    columnWidths: [120, undefined],
                    rows: [
                        {
                            cells: [
                                {
                                    type: 'tableCell',
                                    props: { ...defaultBlockProps, colspan: 1, rowspan: 1 },
                                    content: [{ type: 'text', text: '模擬店', styles: {} }],
                                },
                                {
                                    type: 'tableCell',
                                    props: { ...defaultBlockProps, colspan: 1, rowspan: 1 },
                                    content: [],
                                },
                            ],
                        },
                    ],
                },
                children: [],
            },
        ]

        const result = articleDocumentSchema.safeParse(JSON.parse(JSON.stringify(document)))

        expect(result.success).toBe(true)
        // BlockNoteに戻せるよう、列幅のnullはundefinedに戻す
        expect(result.data?.[1]?.content).toMatchObject({ columnWidths: [120, undefined] })
    })

    it('表の列幅に数値・null以外が入っていたら拒否する', () => {
        const result = articleDocumentSchema.safeParse([
            {
                id: '1',
                type: 'table',
                props: { textColor: 'default' },
                content: { type: 'tableContent', columnWidths: ['120px'], rows: [] },
                children: [],
            },
        ])

        expect(result.success).toBe(false)
    })

    it('quoteにtextAlignmentを渡すと拒否する（quoteはtextAlignmentを持たない）', () => {
        const result = articleDocumentSchema.safeParse([
            {
                id: '1',
                type: 'quote',
                props: { backgroundColor: 'default', textColor: 'default', textAlignment: 'left' },
                content: [{ type: 'text', text: '引用', styles: {} }],
                children: [],
            },
        ])

        expect(result.success).toBe(false)
    })

    it('コードブロック（裏機能。```で作成）を受理する', () => {
        const result = articleDocumentSchema.safeParse([
            {
                id: '1',
                type: 'codeBlock',
                props: { language: 'js' },
                content: [{ type: 'text', text: 'const x = 1', styles: {} }],
                children: [],
            },
        ])

        expect(result.success).toBe(true)
    })

    it('コードブロックの中身にスタイル（太字等）が付いていたら拒否する（プレーンテキストのみ）', () => {
        const result = articleDocumentSchema.safeParse([
            {
                id: '1',
                type: 'codeBlock',
                props: { language: 'js' },
                content: [{ type: 'text', text: 'const x = 1', styles: { bold: true } }],
                children: [],
            },
        ])

        expect(result.success).toBe(false)
    })
})

const EVENT_ID = '0b7e6d5c-4a3b-4c2d-9e1f-a2b3c4d5e6f7'

describe('articleInputSchema', () => {
    it('タイトル・本文とも空でも受理する', () => {
        expect(articleInputSchema.safeParse({ title: '', content: [] }).success).toBe(true)
    })

    it('タイトルの前後の空白を取り除く', () => {
        expect(articleInputSchema.parse({ title: '  模擬店のお知らせ  ', content: [] }).title).toBe('模擬店のお知らせ')
    })

    it('タイトルは100文字まで受理し、101文字は拒否する', () => {
        expect(articleInputSchema.safeParse({ title: 'あ'.repeat(100), content: [] }).success).toBe(true)

        const result = articleInputSchema.safeParse({ title: 'あ'.repeat(101), content: [] })
        expect(result.success).toBe(false)
        expect(result.error?.issues[0]?.message).toBe('タイトルは100文字以内で入力してください')
    })

    it('title / content が無ければ拒否する', () => {
        expect(articleInputSchema.safeParse({ content: [] }).success).toBe(false)
        expect(articleInputSchema.safeParse({ title: '' }).success).toBe(false)
    })

    it('content が記事ドキュメントの形でなければ拒否する', () => {
        const result = articleInputSchema.safeParse({
            title: '',
            content: [{ id: '1', type: 'image', props: {}, children: [] }],
        })

        expect(result.success).toBe(false)
    })
})

describe('articleListQuerySchema', () => {
    it('limit / offset の既定値が入る', () => {
        expect(articleListQuerySchema.parse({ event_id: EVENT_ID })).toEqual({
            event_id: EVENT_ID,
            limit: 20,
            offset: 0,
        })
    })

    it('event_id が無い・UUID でなければ拒否する', () => {
        expect(articleListQuerySchema.safeParse({}).success).toBe(false)
        expect(articleListQuerySchema.safeParse({ event_id: 'dev' }).success).toBe(false)
    })
})

describe('articleResponseSchema', () => {
    it('Supabase が返す形（マイクロ秒・オフセット付きの日時）を受理する', () => {
        const result = articleResponseSchema.safeParse({
            id: '7f1c2a9e-3b4d-4e5f-8a6b-1c2d3e4f5a6b',
            event_id: EVENT_ID,
            title: '',
            content: [],
            created_at: '2026-09-14T01:00:00.123456+00:00',
            updated_at: '2026-09-14T03:30:00.654321+00:00',
        })

        expect(result.success).toBe(true)
    })
})
