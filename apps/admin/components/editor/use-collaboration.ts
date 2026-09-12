'use client'

import { useEffect, useMemo, useState } from 'react'

import YPartyKitProvider from 'y-partykit/provider'
import * as Y from 'yjs'

import { env } from '~/lib/env'

export type CollaborationOptions = {
    /** ルームID（ドキュメント1つ = 1 room = 1 Durable Object）。規則はドメイン確定後に決める */
    roomId: string
    /** PartyKit の入室認証に使う Supabase のアクセストークン */
    accessToken: string | null
}

/**
 * Yjs ドキュメントと PartyKit プロバイダを用意する。
 *
 * - 同期状態（編集中ドキュメント・カーソル）は Yjs が担当。TanStack Query には載せない
 * - CRDT のマージ正しさは Yjs が保証するので、競合解決を自前実装しないこと
 */
export function useCollaboration({ roomId, accessToken }: CollaborationOptions) {
    const doc = useMemo(() => new Y.Doc(), [])
    const [provider, setProvider] = useState<YPartyKitProvider | null>(null)
    const [status, setStatus] = useState<'connecting' | 'connected' | 'disconnected'>('connecting')

    useEffect(() => {
        if (!accessToken) return

        const instance = new YPartyKitProvider(env.NEXT_PUBLIC_PARTYKIT_HOST, roomId, doc, {
            params: { token: accessToken },
        })

        const onStatus = ({ status: next }: { status: string }) => {
            setStatus(next === 'connected' ? 'connected' : 'disconnected')
        }

        instance.on('status', onStatus)
        setProvider(instance)

        return () => {
            instance.off('status', onStatus)
            instance.destroy()
            setProvider(null)
        }
    }, [doc, roomId, accessToken])

    useEffect(() => () => doc.destroy(), [doc])

    return { doc, provider, status }
}
