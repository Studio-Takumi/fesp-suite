import { Inbox, RefreshCw } from 'lucide-react'

export type EmptyStateProps = {
    /** 見出し（例: 「お知らせはまだありません」） */
    title: string
    /** 説明 */
    description: string
    /** 「再読み込み」を押したとき。一覧を読み込み直す */
    onRetry: () => void
}

/**
 * 一覧が0件のときに、一覧の代わりに出す空状態（デザインの「状態: 空」）。
 * どの一覧でも見た目を揃えるため、文言だけを呼び出し側から渡す
 */
export function EmptyState({ title, description, onRetry }: EmptyStateProps) {
    return (
        <div className='flex flex-col items-center gap-4 px-8 py-16 text-center'>
            <div className='flex size-18 items-center justify-center rounded-full bg-slate-50'>
                <Inbox size={32} className='text-slate-300' aria-hidden />
            </div>
            <h2 className='text-base font-bold text-slate-900'>{title}</h2>
            <p className='text-sm leading-relaxed text-slate-500'>{description}</p>
            <button
                type='button'
                onClick={onRetry}
                className='flex items-center gap-2 rounded-full bg-slate-100 px-6 py-3 text-sm font-medium text-slate-700 hover:bg-slate-200'
            >
                <RefreshCw size={16} aria-hidden />
                再読み込み
            </button>
        </div>
    )
}
