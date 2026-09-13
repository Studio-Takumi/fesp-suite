'use client'

import { BlockNoteSchema, defaultBlockSpecs } from '@blocknote/core'
import { ja } from '@blocknote/core/locales'
import { useCreateBlockNote } from '@blocknote/react'
import { BlockNoteView } from '@blocknote/shadcn'
import '@blocknote/shadcn/style.css'

import type { ArticleDocument } from '@fesp/schema'

export const articleSchema = BlockNoteSchema.create({
    blockSpecs: {
        paragraph: defaultBlockSpecs.paragraph,
        heading: defaultBlockSpecs.heading,
        bulletListItem: defaultBlockSpecs.bulletListItem,
        numberedListItem: defaultBlockSpecs.numberedListItem,
    },
})

export type ArticleEditorProps = {
    content?: ArticleDocument
    onChange?: (document: ArticleDocument) => void
}

/**
 * 記事本文の編集（テキスト・見出し・リスト）。BlockNote（Notionライクなブロックエディタ）ベース。
 *
 * 見出し・太字などのツールバーはBlockNote標準のもの（テキスト選択時のフローティングツールバー・
 * `/` のスラッシュメニュー）をそのまま使う。独自コンポーネントブロックの挿入・テンプレートに
 * よるロックは #24 で対応する。共同編集（Yjs）はこの版では繋がない
 * （同期編集は `collaborative-editor.tsx` の役割）。
 */
export function ArticleEditor({ content, onChange }: ArticleEditorProps) {
    const editor = useCreateBlockNote({
        schema: articleSchema,
        dictionary: ja,
        initialContent: content && content.length > 0 ? content : undefined,
    })

    return (
        <div className='rounded-md border border-border'>
            <BlockNoteView
                editor={editor}
                aria-label='本文エディタ'
                onChange={() => onChange?.(editor.document as ArticleDocument)}
            />
        </div>
    )
}
