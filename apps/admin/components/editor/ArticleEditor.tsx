'use client'

import { useCallback } from 'react'

import { BlockNoteSchema, defaultBlockSpecs, filterSuggestionItems } from '@blocknote/core'
import { ja } from '@blocknote/core/locales'
import {
    BlockNoteViewRaw,
    ComponentsContext,
    getDefaultReactSlashMenuItems,
    SuggestionMenuController,
    useCreateBlockNote,
} from '@blocknote/react'
import { components as shadcnComponents, ShadCNComponentsContext, ShadCNDefaultComponents } from '@blocknote/shadcn'
import '@blocknote/shadcn/style.css'

import type { ArticleDocument } from '@fesp/schema'

import { EmojiGridRoot } from './EmojiGridRoot'
import { SlashMenuItem } from './SlashMenuItem'
import { SlashMenuRoot } from './SlashMenuRoot'

/**
 * スラッシュメニュー・絵文字ピッカーの見た目をNotionに寄せる。スラッシュメニューは項目の
 * 説明を常時表示せずホバーのツールチップにし（SlashMenuItem）、どちらも外枠を一定の高さで
 * スクロールさせる（SlashMenuRoot / EmojiGridRoot）。
 */
const editorComponents = {
    ...shadcnComponents,
    SuggestionMenu: { ...shadcnComponents.SuggestionMenu, Root: SlashMenuRoot, Item: SlashMenuItem },
    GridSuggestionMenu: { ...shadcnComponents.GridSuggestionMenu, Root: EmojiGridRoot },
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
        // 裏機能。バッククォート3つ（```）で誰でも作れるが、スラッシュメニューには出さない
        codeBlock: defaultBlockSpecs.codeBlock,
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
 * `/` のスラッシュメニュー）をそのまま使う。コードブロックは``` で作れる裏機能として
 * スキーマ上は許可するが、スラッシュメニューには出さない（getSlashMenuItems参照）。
 * 独自コンポーネントブロックの挿入・テンプレートによるロックは #24 で対応する。
 * 共同編集（Yjs）はこの版では繋がない（同期編集は `collaborative-editor.tsx` の役割）。
 */
export function ArticleEditor({ content, onChange }: ArticleEditorProps) {
    const editor = useCreateBlockNote({
        schema: articleSchema,
        dictionary: ja,
        initialContent: content && content.length > 0 ? content : undefined,
    })

    // コードブロックは裏機能（```で作れる）なのでスラッシュメニューには出さない。
    // `key` はロケールに依存しない識別子（BlockNoteのi18n辞書のキー名）。
    // `DefaultReactSuggestionItem` の型定義は`key`を持たないが、実体には残っている
    const getSlashMenuItems = useCallback(
        async (query: string) => {
            const items = await getDefaultReactSlashMenuItems(editor)
            return filterSuggestionItems(
                items.filter((item) => (item as { key?: string }).key !== 'code_block'),
                query,
            )
        },
        [editor],
    )

    return (
        <div className='rounded-md border border-border'>
            <ShadCNComponentsContext.Provider value={ShadCNDefaultComponents}>
                <ComponentsContext.Provider value={editorComponents}>
                    <BlockNoteViewRaw
                        editor={editor}
                        theme='light'
                        className='bn-shadcn'
                        aria-label='本文エディタ'
                        slashMenu={false}
                        onChange={() => onChange?.(editor.document as ArticleDocument)}
                    >
                        <SuggestionMenuController triggerCharacter='/' getItems={getSlashMenuItems} />
                    </BlockNoteViewRaw>
                </ComponentsContext.Provider>
            </ShadCNComponentsContext.Provider>
        </div>
    )
}
