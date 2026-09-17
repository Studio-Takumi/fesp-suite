const TIME_ZONE = 'Asia/Tokyo'

const WEEKDAYS_EN = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const WEEKDAYS_JA = ['日', '月', '火', '水', '木', '金', '土']

// 長いトークンを先に並べる（MM と mm、DD と dd は大文字小文字で区別する。MM は M より先に照合する）
const TOKEN_PATTERN = /YYYY|yyyy|EEE|MM|M|DD|dd|D|HH|H|mm|ss/g

const partsFormat = new Intl.DateTimeFormat('en-US', {
    timeZone: TIME_ZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    weekday: 'short',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hourCycle: 'h23',
})

export type DateInput = Date | string

/**
 * 日時を表示用の文字列にする。閲覧端末のタイムゾーンに関係なく、常に日本時間で出す。
 *
 * トークン: `YYYY` / `yyyy` 年、`MM` 月、`DD` / `dd` 日、`HH` 時（24時間）、`mm` 分、`ss` 秒、`EEE` 曜日（日〜土）。
 * `M` / `D` / `H` はゼロ埋めしない月・日・時
 *
 *   dateFormatter('2026-09-14T03:30:00+00:00', 'YYYY/MM/DD(EEE) HH:mm') // '2026/09/14(月) 12:30'
 */
export function dateFormatter(date: DateInput, format: string): string {
    const parts = partsFormat.formatToParts(typeof date === 'string' ? new Date(date) : date)
    const part = (type: Intl.DateTimeFormatPartTypes) => parts.find((p) => p.type === type)?.value ?? ''

    const tokens: Record<string, string> = {
        YYYY: part('year'),
        yyyy: part('year'),
        MM: part('month'),
        M: String(Number(part('month'))),
        DD: part('day'),
        dd: part('day'),
        D: String(Number(part('day'))),
        HH: part('hour'),
        H: String(Number(part('hour'))),
        mm: part('minute'),
        ss: part('second'),
        EEE: WEEKDAYS_JA[WEEKDAYS_EN.indexOf(part('weekday'))] ?? '',
    }

    return format.replace(TOKEN_PATTERN, (token) => tokens[token] ?? token)
}
