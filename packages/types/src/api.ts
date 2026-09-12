/** API クライアントが投げるエラー（HTTPステータスとAPIのエラーコードを保持） */
export class ApiError extends Error {
    constructor(
        readonly status: number,
        readonly code: string,
        message: string,
        readonly details?: Record<string, string[]>,
    ) {
        super(message)
        this.name = 'ApiError'
    }

    get isUnauthorized(): boolean {
        return this.status === 401
    }

    get isForbidden(): boolean {
        return this.status === 403
    }

    get isNotFound(): boolean {
        return this.status === 404
    }
}

/** 成功/失敗を値で表す（例外を投げたくない箇所用） */
export type Result<T, E = ApiError> = { ok: true; value: T } | { ok: false; error: E }

/** API リクエストの共通オプション */
export type RequestOptions = {
    signal?: AbortSignal
    /** 認証が必要なエンドポイントを叩くときに付ける */
    accessToken?: string | null
}
