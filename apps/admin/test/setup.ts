import '@testing-library/jest-dom/vitest'
import { cleanup } from '@testing-library/react'
import { afterEach } from 'vitest'

/**
 * jsdomは座標系のAPIを実装しないため、ProseMirror（BlockNote/TipTapの内部実装）が使う
 * クリック位置計算・フローティングUIの配置計算がエラーになる。テスト用の最小限のpolyfill。
 */
if (typeof document.elementFromPoint !== 'function') {
    document.elementFromPoint = () => null
}
if (typeof document.elementsFromPoint !== 'function') {
    document.elementsFromPoint = () => []
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

/** jsdomは ResizeObserver を実装しないため、Radix UI（Switch など）が要素の大きさを測るところでエラーになる */
if (typeof globalThis.ResizeObserver !== 'function') {
    globalThis.ResizeObserver = class {
        observe() {}
        unobserve() {}
        disconnect() {}
    }
}

/** jsdomは pointer capture と scrollIntoView を実装しないため、Radix UI の Select を開くところでエラーになる */
if (typeof Element.prototype.hasPointerCapture !== 'function') {
    Element.prototype.hasPointerCapture = () => false
}
if (typeof Element.prototype.releasePointerCapture !== 'function') {
    Element.prototype.releasePointerCapture = () => {}
}
if (typeof Element.prototype.scrollIntoView !== 'function') {
    Element.prototype.scrollIntoView = () => {}
}

afterEach(() => {
    cleanup()
})
