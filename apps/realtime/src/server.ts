import type * as Party from 'partykit/server'
import { onConnect } from 'y-partykit'

import { canJoinRoom, extractToken, type RealtimeEnv, verifyToken } from './auth'

/**
 * Yjs 同期サーバー。
 *
 * - ドキュメント1つ = 1 room（= 1 Durable Object）
 * - サーバーの役割は「中継 / 保存 / 認証」のみ。CRDT のマージ正しさは Yjs が保証する
 * - ライブ状態はここで保持し、確定保存は Hono API 経由で Supabase に書き出す
 */
export default class YjsServer implements Party.Server {
    constructor(readonly room: Party.Room) {}

    /**
     * 接続前の認証。未認証は入室拒否する。
     * ここで弾けば Durable Object を起こさずに済む。
     */
    static async onBeforeConnect(request: Party.Request, lobby: Party.Lobby) {
        const token = extractToken(request.url)
        if (!token) {
            return new Response('Unauthorized: token がありません', { status: 401 })
        }

        try {
            const env = lobby.env as unknown as RealtimeEnv
            const claims = await verifyToken(token, env)

            if (!canJoinRoom(claims, lobby.id)) {
                return new Response('Forbidden: このドキュメントを編集する権限がありません', {
                    status: 403,
                })
            }

            // 検証済みの情報を下流（onConnect）へ引き渡す
            request.headers.set('X-User-Id', claims.sub)
            return request
        } catch {
            return new Response('Unauthorized: token が無効です', { status: 401 })
        }
    }

    async onConnect(connection: Party.Connection) {
        return onConnect(connection, this.room, {
            // Durable Object のストレージにスナップショットを保持（ライブ状態）
            persist: { mode: 'snapshot' },
        })
    }

    /** 疎通確認用（GET /parties/main/<roomId>） */
    async onRequest(request: Party.Request) {
        if (request.method === 'GET') {
            return Response.json({
                room: this.room.id,
                connections: [...this.room.getConnections()].length,
            })
        }
        return new Response('Method Not Allowed', { status: 405 })
    }
}

YjsServer satisfies Party.Worker
