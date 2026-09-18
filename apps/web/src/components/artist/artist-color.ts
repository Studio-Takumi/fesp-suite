/** 出演者ごとの色（デザインの ArtistCard の紫・緑・水色） */
export type ArtistColor = {
    /** カードの枠・セットリストの番号の丸の背景 */
    background: string
    /** Day のバッジの背景 */
    accentBackground: string
    /** 三角の飾り・出演者名の1文字目・セットリストの番号の文字 */
    accentText: string
}

const ARTIST_COLORS: ArtistColor[] = [
    { background: 'bg-violet-200', accentBackground: 'bg-violet-400', accentText: 'text-violet-400' },
    { background: 'bg-emerald-200', accentBackground: 'bg-emerald-400', accentText: 'text-emerald-400' },
    { background: 'bg-sky-200', accentBackground: 'bg-sky-500', accentText: 'text-sky-500' },
]

/**
 * 出演者の ID から色を決める。同じ出演者にはいつも同じ色を返す
 * （出演者ごとの色はデータに持たせず、カード・サマリー・セットリストで同じ規則で決める）
 */
export function artistColor(id: string): ArtistColor {
    const sum = [...id].reduce((total, character) => total + character.charCodeAt(0), 0)

    return ARTIST_COLORS[sum % ARTIST_COLORS.length]!
}
