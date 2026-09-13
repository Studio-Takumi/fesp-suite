import '@testing-library/jest-dom/vitest'
import { cleanup } from '@testing-library/react'
import { afterEach } from 'vitest'

/**
 * jsdomは座標系のAPIを実装しないため、ProseMirror（TipTap）が内部で使う
 * クリック位置計算がエラーになる。テスト用の最小限のpolyfill。
 */
if (typeof document.elementFromPoint !== 'function') {
    document.elementFromPoint = () => null
}
if (typeof Range.prototype.getClientRects !== 'function') {
    Range.prototype.getClientRects = () =>
        ({ length: 0, item: () => null, [Symbol.iterator]: [].values }) as DOMRectList
}
if (typeof Range.prototype.getBoundingClientRect !== 'function') {
    Range.prototype.getBoundingClientRect = () => ({
        x: 0,
        y: 0,
        width: 0,
        height: 0,
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        toJSON: () => '',
    })
}

afterEach(() => {
    cleanup()
})
