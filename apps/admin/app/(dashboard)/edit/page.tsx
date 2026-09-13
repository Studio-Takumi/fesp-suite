'use client'

import dynamic from 'next/dynamic'
import { useState } from 'react'

import type { ArticleDocument } from '@fesp/schema'

// BlockNoteのエディタ生成はブラウザAPI（window）に依存するためSSR不可
const ArticleEditor = dynamic(() => import('~/components/editor/article-editor').then((mod) => mod.ArticleEditor), {
    ssr: false,
})

/**
 * 記事エディタの暫定入口（#5）。
 *
 * 一覧からの導線・保存先はまだない。独自コンポーネントブロック・テンプレートロックは #24。
 */
export default function EditArticlePage() {
    const [articleDocument, setArticleDocument] = useState<ArticleDocument>([])

    return (
        <div className='space-y-6 p-8'>
            <h1 className='text-2xl font-bold'>記事エディタ</h1>

            <ArticleEditor onChange={setArticleDocument} />

            <details className='rounded-md border border-border p-4 text-sm'>
                <summary className='cursor-pointer font-medium'>JSON（確認用）</summary>
                <pre className='mt-2 overflow-x-auto whitespace-pre-wrap'>
                    {JSON.stringify(articleDocument, null, 2)}
                </pre>
            </details>
        </div>
    )
}
