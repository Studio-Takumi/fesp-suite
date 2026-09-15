'use client'

import Collaboration from '@tiptap/extension-collaboration'
import CollaborationCaret from '@tiptap/extension-collaboration-caret'
import { EditorContent, useEditor } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import { Cloud, CloudOff, Save } from 'lucide-react'

import { Button } from '~/components/ui/button'

import { useCollaboration } from './use-collaboration'

export type CollaborativeEditorProps = {
    roomId: string
    accessToken: string | null
    userName: string
    userColor?: string
    /** 「確定保存」。Yjs スナップショットを Hono API 経由で Supabase に書き出す */
    onCommit?: (json: unknown) => void | Promise<void>
}

/**
 * Notion ライクなリッチテキスト編集 + 同期編集。
 *
 * 二段構え:
 *   ライブ編集  = Yjs on PartyKit（このコンポーネント）
 *   確定データ  = Hono → Supabase（onCommit）
 */
export function CollaborativeEditor({
    roomId,
    accessToken,
    userName,
    userColor = '#ff6600',
    onCommit,
}: CollaborativeEditorProps) {
    const { doc, provider, status } = useCollaboration({ roomId, accessToken })

    const editor = useEditor(
        {
            immediatelyRender: false,
            extensions: [
                // 履歴は Yjs が持つので StarterKit 側の undo/redo は無効化する
                StarterKit.configure({ undoRedo: false }),
                Collaboration.configure({ document: doc }),
                ...(provider
                    ? [CollaborationCaret.configure({ provider, user: { name: userName, color: userColor } })]
                    : []),
            ],
            editorProps: {
                attributes: {
                    class: 'prose max-w-none min-h-64 p-4 focus:outline-none',
                    'aria-label': '本文エディタ',
                },
            },
        },
        [doc, provider, userName, userColor],
    )

    return (
        <div className='space-y-3'>
            <div className='flex items-center justify-between'>
                <p className='flex items-center gap-2 text-sm text-muted-foreground'>
                    {status === 'connected' ? (
                        <>
                            <Cloud aria-hidden className='size-4' />
                            同期中
                        </>
                    ) : (
                        <>
                            <CloudOff aria-hidden className='size-4' />
                            {status === 'connecting' ? '接続中…' : 'オフライン'}
                        </>
                    )}
                </p>

                {onCommit ? (
                    <Button size='sm' onClick={() => void onCommit(editor?.getJSON())} disabled={!editor}>
                        <Save aria-hidden className='size-4' />
                        保存
                    </Button>
                ) : null}
            </div>

            <div className='rounded-md border border-border'>
                <EditorContent editor={editor} />
            </div>
        </div>
    )
}
