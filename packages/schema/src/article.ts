import { z } from 'zod'

/**
 * 記事ドキュメント（TipTap/ProseMirror JSON）のzodスキーマ。
 *
 * `#5` 時点ではテキスト系ノードのみを対象にする。独自コンポーネントノード（`component`）は
 * `#24` で追加する（docs/article-system.md 参照）。
 */

const markSchema = z.discriminatedUnion('type', [
    z.object({ type: z.literal('bold') }),
    z.object({ type: z.literal('italic') }),
])
export type ArticleMark = z.infer<typeof markSchema>

const textNodeSchema = z.object({
    type: z.literal('text'),
    text: z.string().min(1),
    marks: z.array(markSchema).optional(),
})
export type ArticleTextNode = z.infer<typeof textNodeSchema>

const inlineContentSchema = z.array(textNodeSchema)

const headingNodeSchema = z.object({
    type: z.literal('heading'),
    attrs: z.object({ level: z.union([z.literal(1), z.literal(2), z.literal(3)]) }),
    content: inlineContentSchema.optional(),
})
export type ArticleHeadingNode = z.infer<typeof headingNodeSchema>

const paragraphNodeSchema = z.object({
    type: z.literal('paragraph'),
    content: inlineContentSchema.optional(),
})
export type ArticleParagraphNode = z.infer<typeof paragraphNodeSchema>

export type ArticleListItemNode = {
    type: 'listItem'
    content: (ArticleParagraphNode | ArticleBulletListNode | ArticleOrderedListNode)[]
}
export type ArticleBulletListNode = {
    type: 'bulletList'
    content: ArticleListItemNode[]
}
export type ArticleOrderedListNode = {
    type: 'orderedList'
    attrs?: { start?: number }
    content: ArticleListItemNode[]
}

const listItemNodeSchema: z.ZodType<ArticleListItemNode> = z.lazy(() =>
    z.object({
        type: z.literal('listItem'),
        content: z.array(z.union([paragraphNodeSchema, bulletListNodeSchema, orderedListNodeSchema])),
    }),
)

const bulletListNodeSchema: z.ZodType<ArticleBulletListNode> = z.lazy(() =>
    z.object({
        type: z.literal('bulletList'),
        content: z.array(listItemNodeSchema),
    }),
)

const orderedListNodeSchema: z.ZodType<ArticleOrderedListNode> = z.lazy(() =>
    z.object({
        type: z.literal('orderedList'),
        attrs: z.object({ start: z.number().int().min(1).optional() }).optional(),
        content: z.array(listItemNodeSchema),
    }),
)

const blockNodeSchema = z.union([headingNodeSchema, paragraphNodeSchema, bulletListNodeSchema, orderedListNodeSchema])
export type ArticleBlockNode = z.infer<typeof blockNodeSchema>

/** 記事ドキュメント全体の形。`doc` ノードが直下に持てるのはブロック系ノードのみ */
export const articleDocumentSchema = z.object({
    type: z.literal('doc'),
    content: z.array(blockNodeSchema),
})
export type ArticleDocument = z.infer<typeof articleDocumentSchema>
