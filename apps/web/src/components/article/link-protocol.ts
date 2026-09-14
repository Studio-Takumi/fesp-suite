const ALLOWED_PROTOCOLS = new Set(['http:', 'https:', 'mailto:', 'tel:'])

/**
 * リンクにしてよい URL ならプロトコル（`https:` など）を返す。
 * 記事スキーマの `z.url()` は `javascript:` なども通してしまうため、描画時に許可したものだけに絞る
 */
export function getAllowedLinkProtocol(href: string): string | undefined {
    try {
        const { protocol } = new URL(href)
        return ALLOWED_PROTOCOLS.has(protocol) ? protocol : undefined
    } catch {
        return undefined
    }
}
