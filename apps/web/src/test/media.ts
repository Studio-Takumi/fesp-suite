/**
 * jsdom は `matchMedia` を持たないので差し替える（`lib/use-media-query.ts` が使う）。
 * 幅の分かれ目は2ペインの `md` だけなので、クエリの中身は見ずに1つの状態で答える
 */
let isTablet = false

const listeners = new Set<() => void>()

/** テストの中で画面を `md` 以上／未満に切り替える。描画より前に呼ぶ */
export function setTabletWidth(value: boolean) {
    isTablet = value
    for (const listener of listeners) listener()
}

export function installMatchMedia() {
    window.matchMedia = ((query: string) => ({
        media: query,
        get matches() {
            return isTablet
        },
        onchange: null,
        addEventListener: (_: string, listener: () => void) => listeners.add(listener),
        removeEventListener: (_: string, listener: () => void) => listeners.delete(listener),
        addListener: (listener: () => void) => listeners.add(listener),
        removeListener: (listener: () => void) => listeners.delete(listener),
        dispatchEvent: () => false,
    })) as unknown as typeof window.matchMedia
}

/** テストごとに `md` 未満（iPhone 幅）に戻す */
export function resetMatchMedia() {
    isTablet = false
    listeners.clear()
}
