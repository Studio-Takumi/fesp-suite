import { dateFormatter } from '@fesp/ui'

/**
 * 天気の仮データ。天気の API ができたら、`lib/queries.ts` の `weatherQuery` の queryFn ごと差し替える。
 * 天気の独自コンポーネント（`todayWeather` など）は、どれもこの形のデータを読む
 */

/** 天気の種類。アイコンは `components/weather/weather-kinds.ts` で決める */
export type WeatherKind = 'sunny' | 'partlyCloudy' | 'cloudy' | 'rainy'

/** 1日分の予報 */
export type DailyForecast = {
    /** 日本時間の日付（`YYYY-MM-DD`） */
    date: string
    weather: WeatherKind
    /** 最高気温（°C） */
    maxTemperature: number
    /** 最低気温（°C） */
    minTemperature: number
    /** 降水確率（%） */
    precipitationProbability: number
}

/** 発表中の警報・注意報の1件 */
export type WeatherWarning = {
    /** 種類（`暴風` など。「警報」「注意報」は付けない） */
    name: string
    /** `warning`（警報） / `advisory`（注意報） */
    level: 'warning' | 'advisory'
}

export type Weather = {
    /** 今日の天気 */
    today: DailyForecast & {
        /** 現在の気温（°C） */
        temperature: number
    }
    /** 週間予報。今日から日付の順 */
    weekly: DailyForecast[]
    /** 発表中の警報・注意報 */
    alert: {
        /** 発表中の警報・注意報。無ければ空 */
        warnings: WeatherWarning[]
        /** 気象台の解説の文章 */
        description: string
    }
    /** 暑さ指数（WBGT） */
    wbgt: number
    /** 気象台の天気概況の文章 */
    overview: string
    /** 天気のデータの更新日時 */
    updatedAt: string
}

const DAY = 24 * 60 * 60 * 1000

/** 仮データ。「今日」「明日」が出るよう、日付は `now` から作る */
export function createMockWeather(now: Date = new Date()): Weather {
    const date = (days: number) => dateFormatter(new Date(now.getTime() + days * DAY), 'YYYY-MM-DD')

    const weekly: DailyForecast[] = [
        { date: date(0), weather: 'sunny', maxTemperature: 25, minTemperature: 18, precipitationProbability: 40 },
        { date: date(1), weather: 'cloudy', maxTemperature: 23, minTemperature: 17, precipitationProbability: 50 },
        { date: date(2), weather: 'rainy', maxTemperature: 21, minTemperature: 16, precipitationProbability: 80 },
        { date: date(3), weather: 'rainy', maxTemperature: 20, minTemperature: 15, precipitationProbability: 70 },
        {
            date: date(4),
            weather: 'partlyCloudy',
            maxTemperature: 24,
            minTemperature: 17,
            precipitationProbability: 30,
        },
        { date: date(5), weather: 'sunny', maxTemperature: 26, minTemperature: 18, precipitationProbability: 10 },
        {
            date: date(6),
            weather: 'partlyCloudy',
            maxTemperature: 25,
            minTemperature: 19,
            precipitationProbability: 20,
        },
    ]

    return {
        today: { ...weekly[0]!, temperature: 23 },
        weekly,
        alert: {
            warnings: [
                { name: '暴風', level: 'warning' },
                { name: '強風', level: 'advisory' },
                { name: '波浪', level: 'advisory' },
            ],
            description: '12日夜遅くから13日明け方まで暴風に警戒してください。',
        },
        wbgt: 26,
        overview:
            '東海地方は、高気圧に緩やかに覆われていますが、上空の気圧の谷の影響を受けています。日中は晴れる所もありますが、夕方から次第に雲が広がるでしょう。',
        updatedAt: new Date(now.getTime() - 30 * 60 * 1000).toISOString(),
    }
}
