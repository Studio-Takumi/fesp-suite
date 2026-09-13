'use client'

import { BlockNoteSchema, defaultBlockSpecs } from '@blocknote/core'
import { ja } from '@blocknote/core/locales'
import { BlockNoteViewRaw, ComponentsContext, useCreateBlockNote } from '@blocknote/react'
import { components as shadcnComponents, ShadCNComponentsContext, ShadCNDefaultComponents } from '@blocknote/shadcn'
import '@blocknote/shadcn/style.css'

import type { ArticleDocument } from '@fesp/schema'

import { SlashMenuItem } from './SlashMenuItem'

/** スラッシュメニューの項目だけ、説明を常時表示せずホバーのツールチップにする（SlashMenuItem参照） */
const editorComponents = {
    ...shadcnComponents,
    SuggestionMenu: { ...shadcnComponents.SuggestionMenu, Item: SlashMenuItem },
}

export const articleSchema = BlockNoteSchema.create({
    blockSpecs: {
        paragraph: defaultBlockSpecs.paragraph,
        heading: defaultBlockSpecs.heading,
        bulletListItem: defaultBlockSpecs.bulletListItem,
        numberedListItem: defaultBlockSpecs.numberedListItem,
        checkListItem: defaultBlockSpecs.checkListItem,
        toggleListItem: defaultBlockSpecs.toggleListItem,
        quote: defaultBlockSpecs.quote,
        divider: defaultBlockSpecs.divider,
        table: defaultBlockSpecs.table,
    },
})

export type ArticleEditorProps = {
    content?: ArticleDocument
    onChange?: (document: ArticleDocument) => void
}

/**
 * 記事本文の編集（テキスト・見出し・リスト・チェックリスト・トグルリスト・引用・区切り線・表）。
 * BlockNote（Notionライクなブロックエディタ）ベース。
 *
 * ツールバーはBlockNote標準のもの（テキスト選択時のフローティングツールバー・
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
            <ShadCNComponentsContext.Provider value={ShadCNDefaultComponents}>
                <ComponentsContext.Provider value={editorComponents}>
                    <BlockNoteViewRaw
                        editor={editor}
                        theme='light'
                        className='bn-shadcn'
                        aria-label='本文エディタ'
                        onChange={() => onChange?.(editor.document as ArticleDocument)}
                    />
                </ComponentsContext.Provider>
            </ShadCNComponentsContext.Provider>
        </div>
    )
}
