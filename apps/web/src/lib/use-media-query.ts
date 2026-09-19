import { useCallback, useSyncExternalStore } from 'react'

/** 2カラム・2ペインに切り替える幅（Tailwind の `md`）。クラス側の `md:` と必ず揃える */
export const tabletMediaQuery = '(min-width: 48rem)'

/**
 * メディアクエリに合っているかを返す。
 * 幅で出し分けたいのが見た目だけなら Tailwind の `md:` を使い、
 * このフックは「描画するものそのものが変わる」ときだけ使う（2ペインの左右の出し分けなど）
 */
export function useMediaQuery(query: string) {
    const subscribe = useCallback(
        (onChange: () => void) => {
            const list = window.matchMedia(query)
            list.addEventListener('change', onChange)
            return () => list.removeEventListener('change', onChange)
        },
        [query],
    )

    return useSyncExternalStore(
        subscribe,
        () => window.matchMedia(query).matches,
        // サーバーでは描画しないが、`matchMedia` を持たない環境でも落ちないようにしておく
        () => false,
    )
}
