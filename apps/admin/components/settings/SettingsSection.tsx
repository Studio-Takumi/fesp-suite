'use client'

import type { ReactNode } from 'react'

import { ApiError } from '@fesp/types'

export type SettingsSectionProps = {
    title: string
    description: string
    /** 読み込み・保存で起きたエラー。最後に起きたものだけ出す */
    error?: unknown
    children: ReactNode
}

/** API のエラーを画面に出す文言にする。409 は API のメッセージをそのまま見せる */
export function messageOf(error: unknown): string {
    if (error instanceof ApiError) return error.message
    if (error instanceof Error) return error.message
    return '保存に失敗しました。時間をおいて再度お試しください'
}

/** 開催日・場所・タグの設定画面の共通の枠。見出しと、操作に失敗したときのエラーを出す */
export function SettingsSection({ title, description, error, children }: SettingsSectionProps) {
    return (
        <div className='space-y-6 p-8'>
            <div>
                <h1 className='text-2xl font-bold'>{title}</h1>
                <p className='text-sm text-muted-foreground'>{description}</p>
            </div>

            {error ? (
                <p role='alert' className='text-sm text-destructive'>
                    {messageOf(error)}
                </p>
            ) : null}

            {children}
        </div>
    )
}
