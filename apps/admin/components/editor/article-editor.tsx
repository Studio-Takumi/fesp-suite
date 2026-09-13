'use client'

import type { ReactNode } from 'react'

import { EditorContent, useEditor } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import { Bold, Heading1, Heading2, Heading3, Italic, List, ListOrdered } from 'lucide-react'

import type { ArticleDocument } from '@fesp/schema'

import { Button } from '~/components/ui/button'

const EMPTY_DOCUMENT: ArticleDocument = { type: 'doc', content: [{ type: 'paragraph' }] }

export type ArticleEditorProps = {
    content?: ArticleDocument
    onChange?: (json: ArticleDocument) => void
}

/**
 * 記事本文の編集（テキスト・見出し・リスト）。
 *
 * 独自コンポーネントノードの挿入・テンプレートによるロックは #24 で対応する。
 * 共同編集（Yjs）はこの版では繋がない（同期編集は `collaborative-editor.tsx` の役割）。
 */
export function ArticleEditor({ content = EMPTY_DOCUMENT, onChange }: ArticleEditorProps) {
    const editor = useEditor({
        immediatelyRender: false,
        content,
        extensions: [
            StarterKit.configure({
                heading: { levels: [1, 2, 3] },
                blockquote: false,
                code: false,
                codeBlock: false,
                horizontalRule: false,
                strike: false,
                link: false,
                underline: false,
            }),
        ],
        editorProps: {
            attributes: {
                class: 'prose max-w-none min-h-64 p-4 focus:outline-none',
                'aria-label': '本文エディタ',
            },
        },
        onUpdate: ({ editor: updated }) => {
            onChange?.(updated.getJSON() as ArticleDocument)
        },
    })

    if (!editor) return null

    return (
        <div className='space-y-3'>
            <div
                role='toolbar'
                aria-label='書式'
                className='flex flex-wrap items-center gap-1 rounded-md border border-border p-1'
            >
                <ToolbarButton
                    label='見出し1'
                    active={editor.isActive('heading', { level: 1 })}
                    onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
                >
                    <Heading1 aria-hidden className='size-4' />
                </ToolbarButton>
                <ToolbarButton
                    label='見出し2'
                    active={editor.isActive('heading', { level: 2 })}
                    onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
                >
                    <Heading2 aria-hidden className='size-4' />
                </ToolbarButton>
                <ToolbarButton
                    label='見出し3'
                    active={editor.isActive('heading', { level: 3 })}
                    onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
                >
                    <Heading3 aria-hidden className='size-4' />
                </ToolbarButton>
                <ToolbarButton
                    label='太字'
                    active={editor.isActive('bold')}
                    onClick={() => editor.chain().focus().toggleBold().run()}
                >
                    <Bold aria-hidden className='size-4' />
                </ToolbarButton>
                <ToolbarButton
                    label='斜体'
                    active={editor.isActive('italic')}
                    onClick={() => editor.chain().focus().toggleItalic().run()}
                >
                    <Italic aria-hidden className='size-4' />
                </ToolbarButton>
                <ToolbarButton
                    label='箇条書きリスト'
                    active={editor.isActive('bulletList')}
                    onClick={() => editor.chain().focus().toggleBulletList().run()}
                >
                    <List aria-hidden className='size-4' />
                </ToolbarButton>
                <ToolbarButton
                    label='番号付きリスト'
                    active={editor.isActive('orderedList')}
                    onClick={() => editor.chain().focus().toggleOrderedList().run()}
                >
                    <ListOrdered aria-hidden className='size-4' />
                </ToolbarButton>
            </div>

            <div className='rounded-md border border-border'>
                <EditorContent editor={editor} />
            </div>
        </div>
    )
}

type ToolbarButtonProps = {
    label: string
    active: boolean
    onClick: () => void
    children: ReactNode
}

function ToolbarButton({ label, active, onClick, children }: ToolbarButtonProps) {
    return (
        <Button
            variant={active ? 'default' : 'ghost'}
            size='icon'
            aria-label={label}
            aria-pressed={active}
            // ボタンにDOMフォーカスが移ると本文エディタの選択位置が失われるため、mousedown時点で止める
            onMouseDown={(event) => event.preventDefault()}
            onClick={onClick}
        >
            {children}
        </Button>
    )
}
