/**
 * 一覧のカードの色。模擬店・出演者のカード、商品のサムネ、セットリストの番号で使う。
 * Tailwind がクラス名を見つけられるよう、組み立てずに全部書く
 */
export type CardColor = 'rose' | 'amber' | 'emerald' | 'sky' | 'violet'

export type CardColorClasses = {
    /** カードの枠・サムネの背景 */
    surface: string
    /** Day バッジ・角の飾りの背景 */
    accent: string
    /** 頭文字・番号などの文字 */
    accentText: string
}

export const cardColors: Record<CardColor, CardColorClasses> = {
    rose: { surface: 'bg-rose-200', accent: 'bg-rose-400', accentText: 'text-rose-400' },
    amber: { surface: 'bg-amber-200', accent: 'bg-amber-400', accentText: 'text-amber-400' },
    emerald: { surface: 'bg-emerald-200', accent: 'bg-emerald-400', accentText: 'text-emerald-400' },
    sky: { surface: 'bg-sky-200', accent: 'bg-sky-400', accentText: 'text-sky-400' },
    violet: { surface: 'bg-violet-200', accent: 'bg-violet-400', accentText: 'text-violet-400' },
}

/** 色をデータで持たないもの（出演者）に使う色の並び */
const ID_COLORS: CardColor[] = ['violet', 'emerald', 'sky']

/**
 * ID から色を決める。同じ ID にはいつも同じ色を返す。
 * 出演者は色をデータで持たないので、カード・サマリー・セットリストでこの規則を使う（データで持つのは #80）
 */
export function cardColorFromId(id: string): CardColorClasses {
    const sum = [...id].reduce((total, character) => total + character.charCodeAt(0), 0)

    return cardColors[ID_COLORS[sum % ID_COLORS.length]!]
}
