import { z } from 'zod'

import { paginationQuerySchema, timestampSchema, uuidSchema } from './common'

/**
 * 記事ドキュメント（BlockNoteのブロック配列JSON）のzodスキーマ。
 *
 * `#5` 時点ではテキスト系ブロック（paragraph/heading/bulletListItem/numberedListItem/
 * checkListItem/toggleListItem/quote/divider/table/codeBlock）のみを対象にする。
 * codeBlockはスラッシュメニューには出さない裏機能（ArticleEditor.tsx参照）。
 * 独自コンポーネントブロックは `#24` で追加する（docs/article-system.md 参照）。
 * ブロックの形はBlockNoteの `Block` 型（@blocknote/core）に合わせている。
 */

const colorSchema = z.enum(['default', 'gray', 'brown', 'red', 'orange', 'yellow', 'green', 'blue', 'purple', 'pink'])

const textAlignmentSchema = z.enum(['left', 'center', 'right', 'justify'])

const stylesSchema = z.object({
    bold: z.literal(true).optional(),
    italic: z.literal(true).optional(),
    underline: z.literal(true).optional(),
    strike: z.literal(true).optional(),
    code: z.literal(true).optional(),
    textColor: colorSchema.optional(),
    backgroundColor: colorSchema.optional(),
})
export type ArticleStyles = z.infer<typeof stylesSchema>

const styledTextSchema = z.object({
    type: z.literal('text'),
    text: z.string().min(1),
    styles: stylesSchema,
})
export type ArticleStyledText = z.infer<typeof styledTextSchema>

const linkSchema = z.object({
    type: z.literal('link'),
    href: z.url(),
    content: z.array(styledTextSchema),
})
export type ArticleLink = z.infer<typeof linkSchema>

const inlineContentSchema = z.array(z.union([styledTextSchema, linkSchema]))

const blockPropsSchema = z
    .object({
        backgroundColor: colorSchema,
        textColor: colorSchema,
        textAlignment: textAlignmentSchema,
    })
    .strict()

const headingPropsSchema = blockPropsSchema
    .extend({
        level: z.union([z.literal(1), z.literal(2), z.literal(3), z.literal(4), z.literal(5), z.literal(6)]),
        isToggleable: z.boolean().optional(),
    })
    .strict()

const numberedListItemPropsSchema = blockPropsSchema
    .extend({
        start: z.number().int().min(1).optional(),
    })
    .strict()

const checkListItemPropsSchema = blockPropsSchema
    .extend({
        checked: z.boolean(),
    })
    .strict()

/** quoteは他のテキスト系ブロックと違い、textAlignmentを持たない（BlockNoteの仕様） */
const quotePropsSchema = z
    .object({
        backgroundColor: colorSchema,
        textColor: colorSchema,
    })
    .strict()

const dividerPropsSchema = z.object({}).strict()

/** tableは列単位の背景色・配置を持たない（セル側の`tableCell`が持つ） */
const tablePropsSchema = z
    .object({
        textColor: colorSchema,
    })
    .strict()

const tableCellPropsSchema = z
    .object({
        backgroundColor: colorSchema,
        textColor: colorSchema,
        textAlignment: textAlignmentSchema,
        colspan: z.number().int().min(1).optional(),
        rowspan: z.number().int().min(1).optional(),
    })
    .strict()

const codeBlockPropsSchema = z
    .object({
        language: z.string(),
    })
    .strict()

/** コードブロックの中身はスタイル（太字等）を持たない「プレーンテキスト」 */
const plainTextSchema = z.object({
    type: z.literal('text'),
    text: z.string().min(1),
    styles: z.object({}).strict(),
})
const plainContentSchema = z.array(plainTextSchema)

const tableCellSchema = z.object({
    type: z.literal('tableCell'),
    props: tableCellPropsSchema,
    content: inlineContentSchema,
})
export type ArticleTableCell = z.infer<typeof tableCellSchema>

const tableContentSchema = z.object({
    type: z.literal('tableContent'),
    columnWidths: z.array(z.number().optional()),
    headerRows: z.number().int().min(0).optional(),
    headerCols: z.number().int().min(0).optional(),
    rows: z.array(z.object({ cells: z.array(tableCellSchema) })),
})
export type ArticleTableContent = z.infer<typeof tableContentSchema>

export type ArticleBlock = {
    id: string
    type:
        | 'paragraph'
        | 'heading'
        | 'bulletListItem'
        | 'numberedListItem'
        | 'checkListItem'
        | 'toggleListItem'
        | 'quote'
        | 'divider'
        | 'table'
        | 'codeBlock'
    props: Record<string, unknown>
    content: (ArticleStyledText | ArticleLink)[] | ArticleTableContent | undefined
    children: ArticleBlock[]
}

const articleBlockSchema: z.ZodType<ArticleBlock> = z.lazy(() =>
    z.union([
        z.object({
            id: z.string().min(1),
            type: z.literal('paragraph'),
            props: blockPropsSchema,
            content: inlineContentSchema,
            children: z.array(articleBlockSchema),
        }),
        z.object({
            id: z.string().min(1),
            type: z.literal('heading'),
            props: headingPropsSchema,
            content: inlineContentSchema,
            children: z.array(articleBlockSchema),
        }),
        z.object({
            id: z.string().min(1),
            type: z.literal('bulletListItem'),
            props: blockPropsSchema,
            content: inlineContentSchema,
            children: z.array(articleBlockSchema),
        }),
        z.object({
            id: z.string().min(1),
            type: z.literal('numberedListItem'),
            props: numberedListItemPropsSchema,
            content: inlineContentSchema,
            children: z.array(articleBlockSchema),
        }),
        z.object({
            id: z.string().min(1),
            type: z.literal('checkListItem'),
            props: checkListItemPropsSchema,
            content: inlineContentSchema,
            children: z.array(articleBlockSchema),
        }),
        z.object({
            id: z.string().min(1),
            type: z.literal('toggleListItem'),
            props: blockPropsSchema,
            content: inlineContentSchema,
            children: z.array(articleBlockSchema),
        }),
        z.object({
            id: z.string().min(1),
            type: z.literal('quote'),
            props: quotePropsSchema,
            content: inlineContentSchema,
            children: z.array(articleBlockSchema),
        }),
        z.object({
            id: z.string().min(1),
            type: z.literal('divider'),
            props: dividerPropsSchema,
            content: z.undefined(),
            children: z.array(articleBlockSchema),
        }),
        z.object({
            id: z.string().min(1),
            type: z.literal('table'),
            props: tablePropsSchema,
            content: tableContentSchema,
            children: z.array(articleBlockSchema),
        }),
        z.object({
            id: z.string().min(1),
            type: z.literal('codeBlock'),
            props: codeBlockPropsSchema,
            content: plainContentSchema,
            children: z.array(articleBlockSchema),
        }),
    ]),
)

/** 記事ドキュメント全体の形。BlockNoteの `Block[]`（トップレベルは配列で、`doc` のようなルートノードは無い） */
export const articleDocumentSchema = z.array(articleBlockSchema)
export type ArticleDocument = z.infer<typeof articleDocumentSchema>

/** 記事のタイトル。空文字も許す */
export const articleTitleSchema = z.string().trim().max(100, 'タイトルは100文字以内で入力してください')

/** 記事オブジェクト（GET /api/articles/:id などのレスポンス） */
export const articleResponseSchema = z.object({
    id: uuidSchema,
    event_id: uuidSchema,
    title: z.string(),
    content: articleDocumentSchema,
    created_at: timestampSchema,
    updated_at: timestampSchema,
})
export type ArticleResponse = z.infer<typeof articleResponseSchema>

/** 一覧の1行。本文（content）は返さない */
export const articleListItemSchema = articleResponseSchema.omit({ content: true })
export type ArticleListItem = z.infer<typeof articleListItemSchema>

/** GET /api/articles のレスポンス */
export const articleListResponseSchema = z.object({
    items: z.array(articleListItemSchema),
    limit: z.number().int(),
    offset: z.number().int(),
})
export type ArticleListResponse = z.infer<typeof articleListResponseSchema>

/** 対象イベントを指定するクエリ */
export const articleEventQuerySchema = z.object({
    event_id: uuidSchema,
})
export type ArticleEventQuery = z.infer<typeof articleEventQuerySchema>

/** GET /api/articles のクエリ */
export const articleListQuerySchema = paginationQuerySchema.extend(articleEventQuerySchema.shape)
export type ArticleListQuery = z.infer<typeof articleListQuerySchema>

/** 記事IDのパスパラメータ */
export const articleIdParamSchema = z.object({
    id: uuidSchema,
})

/** POST /api/articles・PUT /api/articles/:id のリクエストボディ */
export const articleInputSchema = z.object({
    title: articleTitleSchema,
    content: articleDocumentSchema,
})
export type ArticleInput = z.infer<typeof articleInputSchema>
