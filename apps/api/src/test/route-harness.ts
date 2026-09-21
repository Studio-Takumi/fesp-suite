import { vi } from 'vitest'

/**
 * ルートのテストで使う supabase-js のクエリビルダーの代わりと、共通の値。
 *
 * `vi.mock` はテストファイルごとに書く必要があるので、状態と組み立てだけをここに置く。
 * （`routes/articles.test.ts` は同じ仕組みを自前で持っている。まとめるのは別の回に）
 */

export type QueryResult = { data: unknown; error: (Error & { code: string }) | null }

/** supabase-js の PostgrestError と同じく Error を継承したエラー */
export function dbError(code: string, message: string): Error & { code: string } {
    return Object.assign(new Error(message), { code })
}

/** 呼ばれたクエリビルダーのメソッドと引数 */
export const calls: { method: string; args: unknown[] }[] = []

/** クエリを await するたびに先頭から1つずつ返す。空になったら `result` を返す */
export const queuedResults: QueryResult[] = []

let result: QueryResult = { data: null, error: null }
let clientToken: string | null = null

export const setResult = (next: QueryResult) => {
    result = next
}

export const tokenOf = () => clientToken

/** supabase-js のクエリビルダーの代わり。呼ばれたメソッドを記録し、await すると結果を返す */
export function createQueryBuilder(): unknown {
    const builder: unknown = new Proxy(
        {},
        {
            get: (_target, method: string) => {
                if (method === 'then') {
                    return (resolve: (value: QueryResult) => void) => resolve(queuedResults.shift() ?? result)
                }
                return (...args: unknown[]) => {
                    calls.push({ method, args })
                    return builder
                }
            },
        },
    )
    return builder
}

/** `vi.mock('../lib/supabase', ...)` の中身。クエリビルダーを返しつつトークンを控える */
export const supabaseMock = {
    createUserClient: (_env: unknown, accessToken: string) => {
        clientToken = accessToken
        return createQueryBuilder()
    },
}

export const USER_ID = '9a8b7c6d-5e4f-4a3b-8c2d-1e0f9a8b7c6d'
export const EVENT_ID = '0b7e6d5c-4a3b-4c2d-9e1f-a2b3c4d5e6f7'

export const testEnv = {
    SUPABASE_URL: 'https://test.supabase.co',
    SUPABASE_ANON_KEY: 'test-anon-key',
    SUPABASE_JWKS_URL: 'https://test.supabase.co/auth/v1/.well-known/jwks.json',
    SUPABASE_JWT_ISSUER: 'https://test.supabase.co/auth/v1',
    ALLOWED_ORIGINS: 'http://localhost:3001',
    ASSETS_BUCKET: {} as R2Bucket,
}

export const authorization = { Authorization: 'Bearer valid-token' }

/** 有効なトークンとして扱われる jwtVerify の戻り値 */
export const validPayload = () => ({
    payload: {
        sub: USER_ID,
        iss: testEnv.SUPABASE_JWT_ISSUER,
        exp: Math.floor(Date.now() / 1000) + 3600,
        role: 'authenticated',
    },
})

export function argsOf(method: string): unknown[][] {
    return calls.filter((call) => call.method === method).map((call) => call.args)
}

export async function errorCodeOf(res: Response): Promise<string> {
    const body = (await res.json()) as { error: { code: string } }
    return body.error.code
}

/** 各テストの前に状態を戻す */
export function resetHarness() {
    vi.clearAllMocks()
    calls.length = 0
    queuedResults.length = 0
    result = { data: null, error: null }
    clientToken = null
}
