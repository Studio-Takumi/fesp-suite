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

const PLACE_ID = '3a4b5c6d-7e8f-4a9b-8c0d-1e2f3a4b5c6d'

const place = {
    id: PLACE_ID,
    event_id: EVENT_ID,
    name: '特別教室A',
    building: '本校舎',
    floor: '3F',
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
        ['GET', `/api/places?event_id=${EVENT_ID}`],
        ['POST', '/api/places'],
        ['PUT', `/api/places/${PLACE_ID}`],
        ['DELETE', `/api/places/${PLACE_ID}`],
    ] as const)('%s %s は Authorization が無いと 401 で、DB を読まない', async (method, path) => {
        const res =
            method === 'GET'
                ? await get(path, {})
                : method === 'DELETE'
                  ? await remove(path, {})
                  : await sendJson(path, method, { event_id: EVENT_ID, name: '特別教室A' }, {})

        expect(res.status).toBe(401)
        expect(calls).toHaveLength(0)
    })
})

describe('GET /api/places', () => {
    it('イベントの場所を sort_order の順で返す', async () => {
        setResult({ data: [place], error: null })

        const res = await get(`/api/places?event_id=${EVENT_ID}`)

        expect(res.status).toBe(200)
        expect(await res.json()).toEqual({ items: [place] })
        expect(argsOf('eq')).toEqual([['event_id', EVENT_ID]])
        expect(argsOf('order')).toEqual([['sort_order']])
    })
})

describe('POST /api/places', () => {
    it('建物・階・並び順を省略すると null と 0 で作る', async () => {
        setResult({ data: place, error: null })

        const res = await sendJson('/api/places', 'POST', { event_id: EVENT_ID, name: '特別教室A' })

        expect(res.status).toBe(201)
        expect(argsOf('insert')).toEqual([
            [{ event_id: EVENT_ID, name: '特別教室A', building: null, floor: null, sort_order: 0 }],
        ])
    })

    it.each([
        ['名前が空', { event_id: EVENT_ID, name: '' }],
        ['名前が50文字を超える', { event_id: EVENT_ID, name: 'あ'.repeat(51) }],
        ['建物が30文字を超える', { event_id: EVENT_ID, name: 'A', building: 'あ'.repeat(31) }],
        ['階が10文字を超える', { event_id: EVENT_ID, name: 'A', floor: 'あ'.repeat(11) }],
        ['並び順が負', { event_id: EVENT_ID, name: 'A', sort_order: -1 }],
    ])('ボディが不正なら 400（%s）', async (_label, body) => {
        const res = await sendJson('/api/places', 'POST', body)

        expect(res.status).toBe(400)
        expect(calls).toHaveLength(0)
    })

    it('staff でなければ 403', async () => {
        setResult({ data: null, error: dbError('42501', 'new row violates row-level security policy') })

        const res = await sendJson('/api/places', 'POST', { event_id: EVENT_ID, name: '特別教室A' })

        expect(res.status).toBe(403)
    })
})

describe('PUT /api/places/:id', () => {
    it('更新後の場所を返す。建物・階の空文字は null にする', async () => {
        setResult({ data: place, error: null })

        const res = await sendJson(`/api/places/${PLACE_ID}`, 'PUT', {
            name: '視聴覚室',
            building: '',
            floor: '',
            sort_order: 2,
        })

        expect(res.status).toBe(200)
        expect(argsOf('update')).toEqual([[{ name: '視聴覚室', building: null, floor: null, sort_order: 2 }]])
    })

    it('更新できず、その行が読めるなら 403 / 読めないなら 404', async () => {
        queuedResults.push({ data: null, error: null }, { data: { id: PLACE_ID }, error: null })
        expect((await sendJson(`/api/places/${PLACE_ID}`, 'PUT', { name: 'A' })).status).toBe(403)

        resetHarness()
        jwtVerify.mockResolvedValue(validPayload())
        queuedResults.push({ data: null, error: null }, { data: null, error: null })
        expect((await sendJson(`/api/places/${PLACE_ID}`, 'PUT', { name: 'A' })).status).toBe(404)
    })
})

describe('DELETE /api/places/:id', () => {
    it('消せたら 204', async () => {
        setResult({ data: { id: PLACE_ID }, error: null })

        expect((await remove(`/api/places/${PLACE_ID}`)).status).toBe(204)
    })

    it('模擬店・出演者から参照されていたら 409', async () => {
        setResult({ data: null, error: dbError('23503', 'violates foreign key constraint') })

        const res = await remove(`/api/places/${PLACE_ID}`)

        expect(res.status).toBe(409)
        expect(await errorCodeOf(res)).toBe('conflict')
    })
})
