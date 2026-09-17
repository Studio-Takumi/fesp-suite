'use client'

import { useCallback } from 'react'

import {
    BlockNoteSchema,
    defaultBlockSpecs,
    filterSuggestionItems,
    insertOrUpdateBlockForSlashMenu,
    SyntaxHighlightingExtension,
} from '@blocknote/core'
import { ja } from '@blocknote/core/locales'
import {
    BlockNoteViewRaw,
    ComponentsContext,
    getDefaultReactSlashMenuItems,
    SuggestionMenuController,
    useCreateBlockNote,
    useEditorState,
} from '@blocknote/react'
import { components as shadcnComponents, ShadCNComponentsContext, ShadCNDefaultComponents } from '@blocknote/shadcn'
import '@blocknote/shadcn/style.css'
import { MapIcon, PanelTop } from 'lucide-react'
import { createHighlighter } from 'shiki'

import type { ArticleDocument } from '@fesp/schema'

import { createMapBlock } from './blocks/MapBlock'
import { createPageHeaderBlock } from './blocks/PageHeaderBlock'
import { type ComponentBlock, ComponentPropsPanel, isComponentBlock } from './ComponentPropsPanel'
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

/**
 * VSCodeのようなシンタックスハイライト（Shiki）。対応言語はこの7つに絞る。
 * コードブロックの背景がBlockNote標準でダーク固定のため、テーマもダーク系にする
 * （ライト系テーマだと一部の文字色が背景に対して読みにくくなるため）
 */
const syntaxHighlighting = SyntaxHighlightingExtension({
    createHighlighter: () =>
        createHighlighter({
            themes: ['github-dark'],
            langs: ['html', 'css', 'javascript', 'typescript', 'json', 'yaml', 'markdown'],
        }),
})

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
        // 独自コンポーネント。中身を持たず、props はサイドパネル（ComponentPropsPanel）で編集する
        pageHeader: createPageHeaderBlock(),
        map: createMapBlock(),
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
 * コードブロックの中身はShiki（VSCode等と同じハイライトエンジン）で色分けする。
 * 対応言語はhtml/css/javascript/typescript/json/yaml/markdownの7つに絞っている
 * （バンドルサイズの都合。増やす場合はsyntaxHighlightingのlangsに足す）。
 * 独自コンポーネントのブロックはスラッシュメニューの「コンポーネント」グループから挿入し、
 * カーソルがある間だけ右のサイドパネル（ComponentPropsPanel）で props を編集する。
 * テンプレートによるロックは #64 で対応する。
 * 共同編集（Yjs）はこの版では繋がない（同期編集は `CollaborativeEditor.tsx` の役割）。
 */
export function ArticleEditor({ content, onChange }: ArticleEditorProps) {
    const editor = useCreateBlockNote({
        schema: articleSchema,
        dictionary: ja,
        extensions: [syntaxHighlighting],
        initialContent: content && content.length > 0 ? content : undefined,
    })

    // コードブロックは裏機能（```で作れる）なのでスラッシュメニューには出さない。
    // `key` はロケールに依存しない識別子（BlockNoteのi18n辞書のキー名）。
    // `DefaultReactSuggestionItem` の型定義は`key`を持たないが、実体には残っている
    const getSlashMenuItems = useCallback(
        async (query: string) => {
            const items = await getDefaultReactSlashMenuItems(editor)
            return filterSuggestionItems(
                [
                    ...items.filter((item) => (item as { key?: string }).key !== 'code_block'),
                    {
                        title: 'ページ見出し',
                        subtext: '英語ラベルと日本語タイトルの見出し',
                        aliases: ['pageheader', 'midashi', 'みだし'],
                        group: 'コンポーネント',
                        icon: <PanelTop />,
                        onItemClick: () => {
                            // 中身の無いブロックを入れるとカーソルが次のブロックに移るので、サイドパネルを開くために戻す
                            const block = insertOrUpdateBlockForSlashMenu(editor, { type: 'pageHeader' })
                            editor.setTextCursorPosition(block)
                        },
                    },
                    {
                        title: 'マップ',
                        subtext: '会場のマップ（検索・フロア切替・場所の一覧）',
                        aliases: ['map', 'chizu', 'ちず', '地図'],
                        group: 'コンポーネント',
                        icon: <MapIcon />,
                        onItemClick: () => {
                            const block = insertOrUpdateBlockForSlashMenu(editor, { type: 'map' })
                            editor.setTextCursorPosition(block)
                        },
                    },
                ],
                query,
            )
        },
        [editor],
    )

    // カーソルがある独自コンポーネントのブロック。無ければサイドパネルを出さない
    const activeComponentBlock = useEditorState({
        editor,
        selector: ({ editor }): ComponentBlock | null => {
            const { block } = editor.getTextCursorPosition()
            // 取り出した id / type / props の組み合わせは TypeScript が追えないので、ComponentBlock として扱う
            return isComponentBlock(block)
                ? ({ id: block.id, type: block.type, props: block.props } as ComponentBlock)
                : null
        },
    })

    // フォームの購読を張り直さないよう、ブロックの props ではなく id が変わったときだけ作り直す
    const activeComponentBlockId = activeComponentBlock?.id
    const handleComponentPropsChange = useCallback(
        (props: ComponentBlock['props']) => {
            if (activeComponentBlockId) editor.updateBlock(activeComponentBlockId, { props })
        },
        [editor, activeComponentBlockId],
    )

    return (
        <div className='flex items-start gap-4'>
            <div className='min-w-0 flex-1 rounded-md border border-border'>
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
            {activeComponentBlock && (
                <ComponentPropsPanel block={activeComponentBlock} onChange={handleComponentPropsChange} />
            )}
        </div>
    )
}
