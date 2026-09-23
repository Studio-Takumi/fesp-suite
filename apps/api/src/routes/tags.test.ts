import { beforeEach, describe, expect, it, vi } from 'vitest'

import {
    argsOf,
    authorization,
    calls,
    dbError,
    errorCodeOf,
    EVENT_ID,
    queuedResults,
    resetHarness,
    setResult,
    testEnv,
    validPayload,
} from '../test/route-harness'

const jwtVerify = vi.fn()

vi.mock('jose', () => ({
    createRemoteJWKSet: () => vi.fn(),
    jwtVerify: (...args: unknown[]) => jwtVerify(...args),
}))

vi.mock('../lib/supabase', async () => {
    const { supabaseMock } = await import('../test/route-harness')
    return supabaseMock
})

const { default: app } = await import('../index')

const TAG_ID = '2a1b3c4d-5e6f-4a7b-8c9d-0e1f2a3b4c5d'
const ARTICLE_ID = '7f1c2a9e-3b4d-4e5f-8a6b-1c2d3e4f5a6b'

const tag = {
    id: TAG_ID,
    event_id: EVENT_ID,
    name: '食べ物',
    sort_order: 0,
    created_at: '2026-09-14T10:00:00+00:00',
    updated_at: '2026-09-14T10:00:00+00:00',
}

const get = (path: string, headers: Record<string, string> = authorization) => app.request(path, { headers }, testEnv)

const sendJson = (
    path: string,
    method: 'POST' | 'PUT',
    body: unknown,
    headers: Record<string, string> = authorization,
) =>
    app.request(
        path,
        { method, headers: { ...headers, 'Content-Type': 'application/json' }, body: JSON.stringify(body) },
        testEnv,
    )

const remove = (path: string, headers: Record<string, string> = authorization) =>
    app.request(path, { method: 'DELETE', headers }, testEnv)

beforeEach(() => {
    resetHarness()
    jwtVerify.mockResolvedValue(validPayload())
})

describe('認証', () => {
    it.each([
        ['GET', `/api/tags?event_id=${EVENT_ID}`],
        ['POST', '/api/tags'],
        ['PUT', `/api/tags/${TAG_ID}`],
        ['DELETE', `/api/tags/${TAG_ID}`],
    ] as const)('%s %s は Authorization が無いと 401 で、DB を読まない', async (method, path) => {
        const res =
            method === 'GET'
                ? await get(path, {})
                : method === 'DELETE'
                  ? await remove(path, {})
                  : await sendJson(path, method, { event_id: EVENT_ID, name: '食べ物' }, {})

        expect(res.status).toBe(401)
        expect(calls).toHaveLength(0)
    })
})

describe('GET /api/tags', () => {
    it('イベントのタグを sort_order の順で返す', async () => {
        setResult({ data: [tag], error: null })

        const res = await get(`/api/tags?event_id=${EVENT_ID}`)

        expect(res.status).toBe(200)
        expect(await res.json()).toEqual({ items: [tag] })
        expect(argsOf('order')).toEqual([['sort_order']])
    })
})

describe('POST /api/tags', () => {
    it('並び順を省略すると 0 で作る', async () => {
        setResult({ data: tag, error: null })

        const res = await sendJson('/api/tags', 'POST', { event_id: EVENT_ID, name: '食べ物' })

        expect(res.status).toBe(201)
        expect(argsOf('insert')).toEqual([[{ event_id: EVENT_ID, name: '食べ物', sort_order: 0 }]])
    })

    it.each([
        ['名前が空', { event_id: EVENT_ID, name: '' }],
        ['名前が20文字を超える', { event_id: EVENT_ID, name: 'あ'.repeat(21) }],
    ])('ボディが不正なら 400（%s）', async (_label, body) => {
        expect((await sendJson('/api/tags', 'POST', body)).status).toBe(400)
        expect(calls).toHaveLength(0)
    })

    it('同じ名前のタグがあれば 409', async () => {
        setResult({ data: null, error: dbError('23505', 'duplicate key value violates unique constraint') })

        const res = await sendJson('/api/tags', 'POST', { event_id: EVENT_ID, name: '食べ物' })

        expect(res.status).toBe(409)
        expect(await errorCodeOf(res)).toBe('conflict')
    })
})

describe('DELETE /api/tags/:id', () => {
    it('記事に付いていても消せる（409 にならない）', async () => {
        setResult({ data: { id: TAG_ID }, error: null })

        expect((await remove(`/api/tags/${TAG_ID}`)).status).toBe(204)
    })

    it('消せず、その行が読めるなら 403 / 読めないなら 404', async () => {
        queuedResults.push({ data: null, error: null }, { data: { id: TAG_ID }, error: null })
        expect((await remove(`/api/tags/${TAG_ID}`)).status).toBe(403)

        resetHarness()
        jwtVerify.mockResolvedValue(validPayload())
        queuedResults.push({ data: null, error: null }, { data: null, error: null })
        expect((await remove(`/api/tags/${TAG_ID}`)).status).toBe(404)
    })
})

describe('PUT /api/articles/:id/tags', () => {
    it('いまの結び付きを消してから、渡されたぶんを入れ直す', async () => {
        const TAG_B = '4c5d6e7f-8a9b-4c0d-8e1f-2a3b4c5d6e7f'
        // 記事が読めるかの確認 → delete → insert → 記事の読み直し
        queuedResults.push(
            { data: { id: ARTICLE_ID }, error: null },
            { data: null, error: null },
            { data: null, error: null },
        )
        setResult({ data: null, error: null })

        const res = await sendJson(`/api/articles/${ARTICLE_ID}/tags`, 'PUT', { tag_ids: [TAG_ID, TAG_B] })

        expect(argsOf('delete')).toHaveLength(1)
        expect(argsOf('insert')).toEqual([
            [
                [
                    { article_id: ARTICLE_ID, tag_id: TAG_ID },
                    { article_id: ARTICLE_ID, tag_id: TAG_B },
                ],
            ],
        ])
        // 読み直した記事が無いので 404。入れ替え自体は行われている
        expect(res.status).toBe(404)
    })

    it('空配列なら消すだけで、入れ直さない', async () => {
        queuedResults.push({ data: { id: ARTICLE_ID }, error: null }, { data: null, error: null })
        setResult({ data: null, error: null })

        await sendJson(`/api/articles/${ARTICLE_ID}/tags`, 'PUT', { tag_ids: [] })

        expect(argsOf('delete')).toHaveLength(1)
        expect(argsOf('insert')).toHaveLength(0)
    })

    it('同じタグが2つ以上入っていたら 400 で、DB を触らない', async () => {
        const res = await sendJson(`/api/articles/${ARTICLE_ID}/tags`, 'PUT', { tag_ids: [TAG_ID, TAG_ID] })

        expect(res.status).toBe(400)
        expect(await errorCodeOf(res)).toBe('bad_request')
        expect(calls).toHaveLength(0)
    })

    it('記事が読めなければ 404 で、消しにいかない', async () => {
        setResult({ data: null, error: null })

        const res = await sendJson(`/api/articles/${ARTICLE_ID}/tags`, 'PUT', { tag_ids: [TAG_ID] })

        expect(res.status).toBe(404)
        expect(argsOf('delete')).toHaveLength(0)
    })

    it('記事と違うイベントのタグが混ざっていたら 404', async () => {
        queuedResults.push(
            { data: { id: ARTICLE_ID }, error: null },
            { data: null, error: null },
            { data: null, error: dbError('42501', 'new row violates row-level security policy') },
        )

        const res = await sendJson(`/api/articles/${ARTICLE_ID}/tags`, 'PUT', { tag_ids: [TAG_ID] })

        expect(res.status).toBe(404)
        expect(await errorCodeOf(res)).toBe('not_found')
    })
})
