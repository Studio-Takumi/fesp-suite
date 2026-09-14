'use client'

import dynamic from 'next/dynamic'
import { useParams } from 'next/navigation'

// BlockNoteのエディタ生成はブラウザAPI（window）に依存するためSSR不可
const ArticleEditView = dynamic(
    () => import('~/components/articles/ArticleEditView').then((mod) => mod.ArticleEditView),
    { ssr: false },
)

export default function ArticleEditPage() {
    const { id } = useParams<{ id: string }>()

    return <ArticleEditView id={id} />
}
