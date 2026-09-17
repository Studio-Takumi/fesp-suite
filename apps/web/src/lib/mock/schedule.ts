/**
 * スケジュールの仮データ（日付 → 会場 → 項目）。本物の API ができたら `lib/queries.ts` の `scheduleQuery` を差し替え、
 * このファイルは消す
 */

export type ScheduleItem = {
    id: string
    /** 名前（例: `オープニング`） */
    title: string
    starts_at: string
    ends_at: string
}

export type ScheduleVenue = {
    id: string
    /** 会場名（例: `体育館`） */
    name: string
    items: ScheduleItem[]
}

export type ScheduleDay = {
    /** 日付（`YYYY-MM-DD`） */
    date: string
    venues: ScheduleVenue[]
}

const item = (id: string, title: string, date: string, startsAt: string, endsAt: string): ScheduleItem => ({
    id,
    title,
    starts_at: `${date}T${startsAt}:00+09:00`,
    ends_at: `${date}T${endsAt}:00+09:00`,
})

export const scheduleDays: ScheduleDay[] = [
    {
        date: '2026-06-06',
        venues: [
            {
                id: 'gym',
                name: '体育館',
                items: [
                    item('1', 'オープニング', '2026-06-06', '08:20', '09:20'),
                    item('2', 'ソラノネ', '2026-06-06', '10:20', '11:00'),
                    item('3', 'ギター部', '2026-06-06', '12:10', '13:00'),
                    item('4', '有志ステージ', '2026-06-06', '13:20', '15:15'),
                    item('5', 'クロージング', '2026-06-06', '15:40', '16:15'),
                ],
            },
            {
                id: 'courtyard',
                name: '中庭',
                items: [
                    item('6', 'ビンゴ予選', '2026-06-06', '09:50', '10:20'),
                    item('7', '有志ステージ', '2026-06-06', '11:00', '11:30'),
                    item('8', 'クイズ大会', '2026-06-06', '13:00', '14:00'),
                    item('9', 'ビンゴ予選', '2026-06-06', '14:30', '15:00'),
                ],
            },
            {
                id: 'shops',
                name: '模擬店',
                items: [item('10', '模擬店', '2026-06-06', '09:40', '15:00')],
            },
        ],
    },
    {
        date: '2026-06-07',
        venues: [
            {
                id: 'gym',
                name: '体育館',
                items: [
                    item('11', 'オープニング', '2026-06-07', '09:00', '09:40'),
                    item('12', '吹奏楽部', '2026-06-07', '10:00', '11:00'),
                    item('13', 'ダンス部', '2026-06-07', '13:00', '14:00'),
                    item('14', 'エンディング', '2026-06-07', '15:00', '16:00'),
                ],
            },
            {
                id: 'courtyard',
                name: '中庭',
                items: [
                    item('15', 'ビンゴ決勝', '2026-06-07', '11:30', '12:30'),
                    item('16', '軽音部', '2026-06-07', '14:00', '15:00'),
                ],
            },
            {
                id: 'shops',
                name: '模擬店',
                items: [item('17', '模擬店', '2026-06-07', '09:40', '14:00')],
            },
        ],
    },
]
