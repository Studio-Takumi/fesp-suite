import { describe, expect, it } from 'vitest'

import {
    articleCreateInputSchema,
    articleDocumentSchema,
    articleInputSchema,
    articleListQuerySchema,
    articleResponseSchema,
    articleViewResponseSchema,
    parseArticleDocument,
} from './article'

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
        expect(articleInputSchema.safeParse({ title: '', content: [], status: 'draft' }).success).toBe(true)
    })

    it('タイトルの前後の空白を取り除く', () => {
        expect(articleInputSchema.parse({ title: '  模擬店のお知らせ  ', content: [], status: 'draft' }).title).toBe(
            '模擬店のお知らせ',
        )
    })

    it('タイトルは100文字まで受理し、101文字は拒否する', () => {
        expect(articleInputSchema.safeParse({ title: 'あ'.repeat(100), content: [], status: 'draft' }).success).toBe(
            true,
        )

        const result = articleInputSchema.safeParse({ title: 'あ'.repeat(101), content: [], status: 'draft' })
        expect(result.success).toBe(false)
        expect(result.error?.issues[0]?.message).toBe('タイトルは100文字以内で入力してください')
    })

    it('title / content が無ければ拒否する', () => {
        expect(articleInputSchema.safeParse({ content: [], status: 'draft' }).success).toBe(false)
        expect(articleInputSchema.safeParse({ title: '', status: 'draft' }).success).toBe(false)
    })

    it('content が記事ドキュメントの形でなければ拒否する', () => {
        const result = articleInputSchema.safeParse({
            title: '',
            content: [{ id: '1', type: 'image', props: {}, children: [] }],
            status: 'draft',
        })

        expect(result.success).toBe(false)
    })
})

describe('articleInputSchema の公開状態', () => {
    it('status は draft / published だけ受理する', () => {
        expect(articleInputSchema.safeParse({ title: '', content: [], status: 'published' }).success).toBe(true)
        expect(articleInputSchema.safeParse({ title: '', content: [], status: 'draft' }).success).toBe(true)
        expect(articleInputSchema.safeParse({ title: '', content: [], status: 'archived' }).success).toBe(false)
    })

    it('status は省略できる（公開状態を変えない）', () => {
        expect(articleInputSchema.parse({ title: '', content: [] })).toEqual({ title: '', content: [] })
    })
})

describe('articleCreateInputSchema', () => {
    it('event_id・タイトル・本文を受理し、タイトルの前後の空白を取り除く', () => {
        expect(articleCreateInputSchema.parse({ event_id: EVENT_ID, title: ' 模擬店 ', content: [] })).toEqual({
            event_id: EVENT_ID,
            title: '模擬店',
            content: [],
        })
    })

    it('event_id が無い・UUID でなければ拒否する', () => {
        expect(articleCreateInputSchema.safeParse({ title: '', content: [] }).success).toBe(false)
        expect(articleCreateInputSchema.safeParse({ event_id: 'dev', title: '', content: [] }).success).toBe(false)
    })
})

describe('articleCreateInputSchema の公開状態', () => {
    it('status は受け取らない（記事は下書きで作る）', () => {
        expect(
            articleCreateInputSchema.parse({ event_id: EVENT_ID, title: '', content: [], status: 'published' }),
        ).toEqual({ event_id: EVENT_ID, title: '', content: [] })
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
    const article = {
        id: '7f1c2a9e-3b4d-4e5f-8a6b-1c2d3e4f5a6b',
        event_id: EVENT_ID,
        created_by: '3c9d1e2f-4a5b-4c6d-8e7f-9a0b1c2d3e4f',
        creator: { display_name: '山田太郎' },
        title: '',
        content: [],
        status: 'published',
        published_version: 1,
        published_at: '2026-09-14T02:00:00.123456+00:00',
        created_at: '2026-09-14T01:00:00.123456+00:00',
        updated_at: '2026-09-14T03:30:00.654321+00:00',
        latest_history: {
            version: 2,
            title: '',
            content: [],
            created_by: '3c9d1e2f-4a5b-4c6d-8e7f-9a0b1c2d3e4f',
            created_at: '2026-09-14T04:00:00.123456+00:00',
            updated_at: '2026-09-14T04:10:00.654321+00:00',
        },
    }

    it('Supabase が返す形（マイクロ秒・オフセット付きの日時）を受理する', () => {
        expect(articleResponseSchema.safeParse(article).success).toBe(true)
    })

    it('最新の版が読めない（latest_history が null の）記事を受理する', () => {
        expect(articleResponseSchema.safeParse({ ...article, latest_history: null }).success).toBe(true)
    })

    it('最新の版を保存した人が null（service_role から保存）でも受理する', () => {
        const result = articleResponseSchema.safeParse({
            ...article,
            latest_history: { ...article.latest_history, created_by: null },
        })

        expect(result.success).toBe(true)
    })

    it('公開中の版の番号・最新の版が無ければ拒否する', () => {
        const { published_version: _publishedVersion, ...withoutPublishedVersion } = article
        const { latest_history: _latestHistory, ...withoutLatestHistory } = article

        expect(articleResponseSchema.safeParse(withoutPublishedVersion).success).toBe(false)
        expect(articleResponseSchema.safeParse(withoutLatestHistory).success).toBe(false)
    })

    it('最新の版の本文が記事ドキュメントの形でなければ拒否する', () => {
        const result = articleResponseSchema.safeParse({
            ...article,
            latest_history: {
                ...article.latest_history,
                content: [{ id: '1', type: 'image', props: {}, children: [] }],
            },
        })

        expect(result.success).toBe(false)
    })

    it('作成者の表示名が未設定（null）でも受理する', () => {
        const result = articleResponseSchema.safeParse({ ...article, creator: { display_name: null } })

        expect(result.success).toBe(true)
    })

    it('作成者（created_by / creator）が無ければ拒否する', () => {
        const { created_by: _createdBy, ...withoutCreatedBy } = article
        const { creator: _creator, ...withoutCreator } = article

        expect(articleResponseSchema.safeParse(withoutCreatedBy).success).toBe(false)
        expect(articleResponseSchema.safeParse(withoutCreator).success).toBe(false)
    })

    it('一度も公開していない（published_at が null の）下書きを受理する', () => {
        const result = articleResponseSchema.safeParse({ ...article, status: 'draft', published_at: null })

        expect(result.success).toBe(true)
    })

    it('公開状態が無い・draft / published でなければ拒否する', () => {
        const { status: _status, ...withoutStatus } = article

        expect(articleResponseSchema.safeParse(withoutStatus).success).toBe(false)
        expect(articleResponseSchema.safeParse({ ...article, status: 'archived' }).success).toBe(false)
    })
})

const paragraph = (id: string, text: string, children: unknown[] = []) => ({
    id,
    type: 'paragraph',
    props: defaultBlockProps,
    content: [{ type: 'text', text, styles: {} }],
    children,
})

describe('parseArticleDocument', () => {
    it('知らない type・props の形が合わないブロックだけ子ブロックごと取り除き、残りを返す', () => {
        const result = parseArticleDocument([
            paragraph('1', '先頭'),
            { id: '2', type: 'shopList', props: { day: 1 }, children: [paragraph('2-1', '模擬店の子')] },
            { ...paragraph('3', '色が不正'), props: { ...defaultBlockProps, textColor: 'rainbow' } },
            paragraph('4', '末尾'),
        ])

        expect(result.map((block) => block.id)).toEqual(['1', '4'])
    })

    it('形の合わない子ブロックだけ取り除き、親と残りの子は残す', () => {
        const result = parseArticleDocument([
            paragraph('1', '親', [{ id: '1-1', type: 'shopList', props: {}, children: [] }, paragraph('1-2', '子')]),
        ])

        expect(result).toHaveLength(1)
        expect(result[0]?.children.map((block) => block.id)).toEqual(['1-2'])
    })

    it('オブジェクトでない要素・children が配列でないブロックは取り除く', () => {
        const result = parseArticleDocument([null, 'text', { ...paragraph('1', '子が無い'), children: undefined }])

        expect(result).toEqual([])
    })

    it('JSONを経由した区切り線・表を受理する', () => {
        const document = [
            { id: '1', type: 'divider', props: {}, content: undefined, children: [] },
            {
                id: '2',
                type: 'table',
                props: { textColor: 'default' },
                content: { type: 'tableContent', columnWidths: [undefined], rows: [] },
                children: [],
            },
        ]

        const result = parseArticleDocument(JSON.parse(JSON.stringify(document)))

        expect(result.map((block) => block.type)).toEqual(['divider', 'table'])
    })
})

describe('articleViewResponseSchema', () => {
    const article = {
        id: '7f1c2a9e-3b4d-4e5f-8a6b-1c2d3e4f5a6b',
        event_id: EVENT_ID,
        created_by: '3c9d1e2f-4a5b-4c6d-8e7f-9a0b1c2d3e4f',
        creator: { display_name: '山田太郎' },
        title: '模擬店のお知らせ',
        status: 'published',
        published_version: 1,
        published_at: '2026-09-14T02:00:00.123456+00:00',
        created_at: '2026-09-14T01:00:00.123456+00:00',
        updated_at: '2026-09-14T03:30:00.654321+00:00',
    }

    it('最新の版は持たない（staff が開いたときに、描画できないブロックを含む版で落とさない）', () => {
        const result = articleViewResponseSchema.safeParse({
            ...article,
            content: [],
            latest_history: {
                version: 2,
                title: '',
                content: [{ id: '1', type: 'shopList', props: { day: 1 }, children: [] }],
                created_by: null,
                created_at: '2026-09-14T04:00:00.123456+00:00',
                updated_at: '2026-09-14T04:10:00.654321+00:00',
            },
        })

        expect(result.success).toBe(true)
        expect(result.data).not.toHaveProperty('latest_history')
    })

    it('本文に描画できないブロックがあっても記事は受理し、そのブロックだけ取り除く', () => {
        const result = articleViewResponseSchema.safeParse({
            ...article,
            content: [{ id: '1', type: 'shopList', props: { day: 1 }, children: [] }, paragraph('2', '現金のみです。')],
        })

        expect(result.success).toBe(true)
        expect(result.data?.content.map((block) => block.id)).toEqual(['2'])
    })

    it('本文が配列でなければ拒否する', () => {
        const result = articleViewResponseSchema.safeParse({ ...article, content: { type: 'doc', content: [] } })

        expect(result.success).toBe(false)
    })
})
