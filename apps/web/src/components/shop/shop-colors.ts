import type { ShopColor } from '~/lib/mock/shop'

/**
 * 模擬店の色ごとのクラス。カードの枠・商品のサムネの背景（`surface`）、Dayバッジ・角の飾り（`accent`）、
 * 頭文字・番号の文字（`accentText`）に使う。Tailwind がクラス名を見つけられるよう、組み立てずに全部書く
 */
export const shopColors: Record<ShopColor, { surface: string; accent: string; accentText: string }> = {
    rose: { surface: 'bg-rose-200', accent: 'bg-rose-400', accentText: 'text-rose-400' },
    amber: { surface: 'bg-amber-200', accent: 'bg-amber-400', accentText: 'text-amber-400' },
    emerald: { surface: 'bg-emerald-200', accent: 'bg-emerald-400', accentText: 'text-emerald-400' },
    sky: { surface: 'bg-sky-200', accent: 'bg-sky-400', accentText: 'text-sky-400' },
}
