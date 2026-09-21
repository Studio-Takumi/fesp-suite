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
    tokenOf,
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

const DAY_ID = '1d2e3f4a-5b6c-4d7e-8f9a-0b1c2d3e4f5a'

const eventDay = {
    id: DAY_ID,
    event_id: EVENT_ID,
    day: 1,
    date: '2026-06-06',
    name: null,
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
        ['GET', `/api/event-days?event_id=${EVENT_ID}`],
        ['POST', '/api/event-days'],
        ['PUT', `/api/event-days/${DAY_ID}`],
        ['DELETE', `/api/event-days/${DAY_ID}`],
    ] as const)('%s %s は Authorization が無いと 401 で、DB を読まない', async (method, path) => {
        const body = { event_id: EVENT_ID, day: 1, date: '2026-06-06' }
        const res =
            method === 'GET'
                ? await get(path, {})
                : method === 'DELETE'
                  ? await remove(path, {})
                  : await sendJson(path, method, body, {})

        expect(res.status).toBe(401)
        expect(await errorCodeOf(res)).toBe('unauthorized')
        expect(calls).toHaveLength(0)
    })
})

describe('GET /api/event-days', () => {
    it('イベントの開催日を day の順で返し、ユーザーのトークンで読む', async () => {
        setResult({ data: [eventDay], error: null })

        const res = await get(`/api/event-days?event_id=${EVENT_ID}`)

        expect(res.status).toBe(200)
        expect(await res.json()).toEqual({ items: [eventDay] })
        expect(argsOf('eq')).toEqual([['event_id', EVENT_ID]])
        expect(argsOf('order')).toEqual([['day']])
        expect(tokenOf()).toBe('valid-token')
    })

    it('event_id が無い・UUID でないと 400', async () => {
        expect((await get('/api/event-days')).status).toBe(400)
        expect((await get('/api/event-days?event_id=not-uuid')).status).toBe(400)
        expect(calls).toHaveLength(0)
    })
})

describe('POST /api/event-days', () => {
    it('作った開催日を 201 で返す', async () => {
        setResult({ data: eventDay, error: null })

        const res = await sendJson('/api/event-days', 'POST', { event_id: EVENT_ID, day: 1, date: '2026-06-06' })

        expect(res.status).toBe(201)
        expect(await res.json()).toEqual(eventDay)
        expect(argsOf('insert')).toEqual([[{ event_id: EVENT_ID, day: 1, date: '2026-06-06', name: null }]])
    })

    it('表示名の空文字は null として保存する', async () => {
        setResult({ data: eventDay, error: null })

        await sendJson('/api/event-days', 'POST', { event_id: EVENT_ID, day: 1, date: '2026-06-06', name: '' })

        expect(argsOf('insert')[0]).toEqual([{ event_id: EVENT_ID, day: 1, date: '2026-06-06', name: null }])
    })

    it.each([
        ['day が1未満', { event_id: EVENT_ID, day: 0, date: '2026-06-06' }],
        ['date の形式が違う', { event_id: EVENT_ID, day: 1, date: '2026/06/06' }],
        ['表示名が30文字を超える', { event_id: EVENT_ID, day: 1, date: '2026-06-06', name: 'あ'.repeat(31) }],
        ['event_id が無い', { day: 1, date: '2026-06-06' }],
    ])('ボディが不正なら 400（%s）', async (_label, body) => {
        const res = await sendJson('/api/event-days', 'POST', body)

        expect(res.status).toBe(400)
        expect(await errorCodeOf(res)).toBe('bad_request')
        expect(calls).toHaveLength(0)
    })

    it('staff でなければ 403', async () => {
        setResult({ data: null, error: dbError('42501', 'new row violates row-level security policy') })

        const res = await sendJson('/api/event-days', 'POST', { event_id: EVENT_ID, day: 1, date: '2026-06-06' })

        expect(res.status).toBe(403)
        expect(await errorCodeOf(res)).toBe('forbidden')
    })

    it('同じ day か date の開催日があれば 409', async () => {
        setResult({ data: null, error: dbError('23505', 'duplicate key value violates unique constraint') })

        const res = await sendJson('/api/event-days', 'POST', { event_id: EVENT_ID, day: 1, date: '2026-06-06' })

        expect(res.status).toBe(409)
        expect(await errorCodeOf(res)).toBe('conflict')
    })
})

describe('PUT /api/event-days/:id', () => {
    it('更新後の開催日を返す。event_id は受け取らない', async () => {
        setResult({ data: eventDay, error: null })

        const res = await sendJson(`/api/event-days/${DAY_ID}`, 'PUT', {
            event_id: '00000000-0000-4000-8000-000000000000',
            day: 2,
            date: '2026-06-07',
            name: '前夜祭',
        })

        expect(res.status).toBe(200)
        expect(argsOf('update')).toEqual([[{ day: 2, date: '2026-06-07', name: '前夜祭' }]])
    })

    it('更新できず、その行が読めるなら 403', async () => {
        // 更新（0件）→ 読めるかの確認（読める）の順で返す
        queuedResults.push({ data: null, error: null }, { data: { id: DAY_ID }, error: null })

        const res = await sendJson(`/api/event-days/${DAY_ID}`, 'PUT', { day: 1, date: '2026-06-06' })

        expect(res.status).toBe(403)
        expect(await errorCodeOf(res)).toBe('forbidden')
    })

    it('更新できず、その行が読めないなら 404', async () => {
        queuedResults.push({ data: null, error: null }, { data: null, error: null })

        const res = await sendJson(`/api/event-days/${DAY_ID}`, 'PUT', { day: 1, date: '2026-06-06' })

        expect(res.status).toBe(404)
        expect(await errorCodeOf(res)).toBe('not_found')
    })

    it('id が UUID でないと 400', async () => {
        const res = await sendJson('/api/event-days/not-uuid', 'PUT', { day: 1, date: '2026-06-06' })

        expect(res.status).toBe(400)
        expect(calls).toHaveLength(0)
    })
})

describe('DELETE /api/event-days/:id', () => {
    it('消せたら 204 でボディなし', async () => {
        setResult({ data: { id: DAY_ID }, error: null })

        const res = await remove(`/api/event-days/${DAY_ID}`)

        expect(res.status).toBe(204)
        expect(await res.text()).toBe('')
        expect(argsOf('delete')).toHaveLength(1)
    })

    it('模擬店・出演者・スケジュールから参照されていたら 409', async () => {
        setResult({ data: null, error: dbError('23503', 'violates foreign key constraint') })

        const res = await remove(`/api/event-days/${DAY_ID}`)

        expect(res.status).toBe(409)
        expect(await errorCodeOf(res)).toBe('conflict')
    })

    it('消せず、その行が読めるなら 403', async () => {
        queuedResults.push({ data: null, error: null }, { data: { id: DAY_ID }, error: null })

        const res = await remove(`/api/event-days/${DAY_ID}`)

        expect(res.status).toBe(403)
    })

    it('消せず、その行が読めないなら 404', async () => {
        queuedResults.push({ data: null, error: null }, { data: null, error: null })

        const res = await remove(`/api/event-days/${DAY_ID}`)

        expect(res.status).toBe(404)
    })
})
