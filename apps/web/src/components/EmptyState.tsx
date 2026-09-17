import { Inbox, RefreshCw } from 'lucide-react'

export type EmptyStateProps = {
    title: string
    description: string
    /** 「再読み込み」を押したとき */
    onRetry: () => void
}

/** 一覧が0件のときの空状態（デザインの `web / 状態: 空 / iPhone`）。アイコン・見出し・説明・再読み込みボタン */
export function EmptyState({ title, description, onRetry }: EmptyStateProps) {
    return (
        <div className='flex flex-col items-center justify-center gap-4 px-8 py-16 text-center'>
            <div className='flex size-18 items-center justify-center rounded-full bg-slate-50'>
                <Inbox size={32} className='text-slate-300' aria-hidden />
            </div>
            <h2 className='text-base font-bold text-slate-900'>{title}</h2>
            <p className='text-sm leading-relaxed text-slate-500'>{description}</p>
            <button
                type='button'
                onClick={onRetry}
                className='flex items-center gap-2 rounded-full bg-slate-100 px-6 py-3 text-sm font-medium text-slate-700'
            >
                <RefreshCw size={16} aria-hidden />
                再読み込み
            </button>
        </div>
    )
}
