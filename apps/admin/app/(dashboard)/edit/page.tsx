'use client'

import { useState } from 'react'

import type { ArticleDocument } from '@fesp/schema'

import { ArticleEditor } from '~/components/editor/article-editor'

const INITIAL_DOCUMENT: ArticleDocument = { type: 'doc', content: [{ type: 'paragraph' }] }

/**
 * 記事エディタの暫定入口（#5）。
 *
 * 一覧からの導線・保存先はまだない。独自コンポーネントノード・テンプレートロックは #24。
 */
export default function EditArticlePage() {
    const [articleDocument, setArticleDocument] = useState<ArticleDocument>(INITIAL_DOCUMENT)

    return (
        <div className='space-y-6 p-8'>
            <h1 className='text-2xl font-bold'>記事エディタ</h1>

            <ArticleEditor content={articleDocument} onChange={setArticleDocument} />

            <details className='rounded-md border border-border p-4 text-sm'>
                <summary className='cursor-pointer font-medium'>JSON（確認用）</summary>
                <pre className='mt-2 overflow-x-auto whitespace-pre-wrap'>
                    {JSON.stringify(articleDocument, null, 2)}
                </pre>
            </details>
        </div>
    )
}
