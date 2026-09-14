import { describe, expect, it } from 'vitest'

import { dateFormatter } from './date-formatter'

describe('dateFormatter', () => {
    it('年月日・時分秒をゼロ埋めして出す', () => {
        expect(dateFormatter('2026-09-14T03:05:09+09:00', 'YYYY/MM/DD HH:mm:ss')).toBe('2026/09/14 03:05:09')
    })

    it('yyyy / dd も YYYY / DD と同じ意味で使える', () => {
        expect(dateFormatter('2026-09-14T03:05:09+09:00', 'yyyy-MM-dd')).toBe('2026-09-14')
    })

    it('曜日（EEE）を日本語1文字で出す', () => {
        expect(dateFormatter('2026-09-14T12:00:00+09:00', 'MM/DD(EEE)')).toBe('09/14(月)')
    })

    it('Date オブジェクトも受け取れる', () => {
        expect(dateFormatter(new Date('2026-09-14T12:00:00+09:00'), 'YYYY年MM月DD日')).toBe('2026年09月14日')
    })

    it('UTC の日時も日本時間に直して出す（日付・曜日もまたぐ）', () => {
        expect(dateFormatter('2026-09-14T15:30:00+00:00', 'YYYY/MM/DD(EEE) HH:mm')).toBe('2026/09/15(火) 00:30')
    })

    it('0時は 24 ではなく 00 にする', () => {
        expect(dateFormatter('2026-09-14T00:00:00+09:00', 'HH:mm')).toBe('00:00')
    })

    it('同じトークンが複数回あってもすべて置き換える', () => {
        expect(dateFormatter('2026-09-14T09:30:00+09:00', 'HH:mm〜HH:mm')).toBe('09:30〜09:30')
    })

    it('トークン以外の文字はそのまま残す', () => {
        expect(dateFormatter('2026-09-14T09:30:00+09:00', '更新: MM月DD日 HH時')).toBe('更新: 09月14日 09時')
    })
})
