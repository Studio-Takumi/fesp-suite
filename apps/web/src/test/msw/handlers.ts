import { http, HttpResponse } from 'msw'

import type { ExampleResponse } from '@fesp/schema'

const API = 'http://localhost:8787'

export const exampleFixture: ExampleResponse = {
    message: 'APIの配線確認用エンドポイントです',
    now: '2026-09-01T10:00:00Z',
}

/** 既定のハッピーパス。個別テストで server.use() して上書きする */
export const handlers = [http.get(`${API}/api/example`, () => HttpResponse.json(exampleFixture))]
