import { z } from 'zod'

/**
 * 記事ドキュメント（BlockNoteのブロック配列JSON）のzodスキーマ。
 *
 * `#5` 時点ではテキスト系ブロック（paragraph/heading/bulletListItem/numberedListItem/
 * checkListItem/toggleListItem/quote/divider/table）のみを対象にする。独自コンポーネント
 * ブロックは `#24` で追加する（docs/article-system.md 参照）。
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
    ]),
)

/** 記事ドキュメント全体の形。BlockNoteの `Block[]`（トップレベルは配列で、`doc` のようなルートノードは無い） */
export const articleDocumentSchema = z.array(articleBlockSchema)
export type ArticleDocument = z.infer<typeof articleDocumentSchema>
