import '@testing-library/jest-dom/vitest'
import { cleanup } from '@testing-library/react'
import { afterAll, afterEach, beforeAll } from 'vitest'

import { server } from './msw/server'

// 未定義のリクエストはテストを失敗させる（APIパスの打ち間違いを検出するため）
beforeAll(() => server.listen({ onUnhandledRequest: 'error' }))

afterEach(() => {
    cleanup()
    server.resetHandlers()
})

afterAll(() => server.close())
