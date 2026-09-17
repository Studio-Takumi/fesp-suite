import type { ComponentType } from 'react'

import { screen, within } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import type { ArticleBlock } from '@fesp/schema'

import type { BlockComponentProps } from '~/components/article/block-registry'
import { createMockWeather, type Weather } from '~/lib/mock/weather'
import { weatherQuery } from '~/lib/queries'
import { createTestQueryClient, renderWithQueryClient } from '~/test/render'

import { TodayWeather } from './TodayWeather'
import { Wbgt } from './Wbgt'
import { WeatherAlert } from './WeatherAlert'
import { WeatherCredit } from './WeatherCredit'
import { WeatherOverview } from './WeatherOverview'
import { WeeklyForecast } from './WeeklyForecast'

const block = (type: ArticleBlock['type']): ArticleBlock => ({ id: '1', type, props: {}, children: [] })

/** 天気のデータを読み込み済みにして描画する */
const renderWithWeather = (
    Component: ComponentType<BlockComponentProps>,
    type: ArticleBlock['type'],
    weather: Weather,
) => {
    const queryClient = createTestQueryClient()
    queryClient.setQueryData(weatherQuery().queryKey, weather)
    return renderWithQueryClient(<Component block={block(type)} />, queryClient)
}

// 2026-09-12(土) 10:40（日本時間）
const NOW = new Date('2026-09-12T10:40:00+09:00')

describe('天気のブロック', () => {
    afterEach(() => {
        vi.useRealTimers()
    })

    it('今日の天気は、天気・現在の気温・最高・最低の気温と降水確率を出す', () => {
        renderWithWeather(TodayWeather, 'todayWeather', createMockWeather(NOW))

        const section = screen.getByRole('region', { name: '今日の天気' })
        expect(section).toHaveTextContent('晴れ 現在の気温23°C')
        expect(within(section).getByText('最高').nextSibling).toHaveTextContent('25°')
        expect(within(section).getByText('最低').nextSibling).toHaveTextContent('18°')
        expect(within(section).getByText('降水').nextSibling).toHaveTextContent('40%')
    })

    it('週間予報は、今日・明日と、それ以外は「日(曜日)」の見出しでカードを並べる', () => {
        vi.useFakeTimers({ toFake: ['Date'] })
        vi.setSystemTime(NOW)

        renderWithWeather(WeeklyForecast, 'weeklyForecast', createMockWeather(NOW))

        const section = screen.getByRole('region', { name: '週間予報' })
        const items = within(section).getAllByRole('listitem')
        expect(items).toHaveLength(7)
        expect(items[0]).toHaveTextContent('今日晴れ最高25最低18降水確率40%')
        expect(items[1]).toHaveTextContent('明日')
        expect(items[2]).toHaveTextContent('14(月)雨')
        expect(items[6]).toHaveTextContent('18(金)')
    })

    it('週間予報は、予報が1日も無ければ何も出さない', () => {
        const { container } = renderWithWeather(WeeklyForecast, 'weeklyForecast', {
            ...createMockWeather(NOW),
            weekly: [],
        })

        expect(container).toBeEmptyDOMElement()
    })

    it('気象警報・注意報は、警報を赤・注意報を黄色のチップで出し、解説を出す', () => {
        renderWithWeather(WeatherAlert, 'weatherAlert', createMockWeather(NOW))

        const section = screen.getByRole('region', { name: '気象警報・注意報' })
        const chips = within(section).getAllByRole('listitem')
        expect(chips.map((chip) => chip.textContent)).toEqual(['暴風警報', '強風注意報', '波浪注意報'])
        expect(chips[0]).toHaveClass('bg-rose-500', 'text-white')
        expect(chips[1]).toHaveClass('bg-amber-400', 'text-slate-900')
        expect(section).toHaveTextContent('12日夜遅くから13日明け方まで暴風に警戒してください。')
    })

    it('気象警報・注意報は、発表中のものが無ければ何も出さない', () => {
        const { container } = renderWithWeather(WeatherAlert, 'weatherAlert', {
            ...createMockWeather(NOW),
            alert: { warnings: [], description: '' },
        })

        expect(container).toBeEmptyDOMElement()
    })

    it.each([
        [24.9, '注意', '積極的に水分補給を', 'text-sky-400'],
        [25, '警戒', '運動時は積極的に休憩を', 'text-amber-400'],
        [28, '厳重警戒', '激しい運動は避けましょう', 'text-orange-400'],
        [31, '危険', '運動は原則中止しましょう', 'text-rose-500'],
        [33, 'アラート', '不要不急の外出は避けましょう', 'text-violet-400'],
    ])('暑さ指数が %s なら段階「%s」と一言を段階の色で出す', (wbgt, level, advice, color) => {
        renderWithWeather(Wbgt, 'wbgt', { ...createMockWeather(NOW), wbgt })

        const section = screen.getByRole('region', { name: '暑さ指数（WBGT）' })
        const value = within(section).getByText(String(wbgt)).parentElement
        expect(value).toHaveTextContent(`${wbgt}${level}`)
        expect(value).toHaveClass(color)
        expect(within(section).getByText(advice)).toBeInTheDocument()
    })

    it('天気概況は、見出しの下に文章を出し、文章が空なら何も出さない', () => {
        const { unmount } = renderWithWeather(WeatherOverview, 'weatherOverview', createMockWeather(NOW))

        const section = screen.getByRole('region', { name: '今日の天気概況' })
        expect(section).toHaveTextContent('東海地方は、高気圧に緩やかに覆われていますが')
        unmount()

        const empty = renderWithWeather(WeatherOverview, 'weatherOverview', { ...createMockWeather(NOW), overview: '' })
        expect(empty.container).toBeEmptyDOMElement()
    })

    it('天気の更新時刻・出典は、更新時刻を日本時間で出す', () => {
        renderWithWeather(WeatherCredit, 'weatherCredit', {
            ...createMockWeather(NOW),
            updatedAt: '2026-09-12T02:10:00Z',
        })

        expect(screen.getByText('11:10 更新 ・ 出典: 気象庁')).toBeInTheDocument()
    })

    it('読み込み中は何も出さず、読み込んだら仮データを出す', async () => {
        const { container } = renderWithQueryClient(<TodayWeather block={block('todayWeather')} />)

        expect(container).toBeEmptyDOMElement()
        expect(await screen.findByRole('region', { name: '今日の天気' })).toBeInTheDocument()
    })

    it('読み込みに失敗したときは何も出さない', () => {
        const queryClient = createTestQueryClient()
        queryClient
            .getQueryCache()
            .build(queryClient, { queryKey: weatherQuery().queryKey as readonly unknown[] })
            .setState({
                status: 'error',
                error: new Error('失敗'),
                fetchStatus: 'idle',
            })
        const { container } = renderWithQueryClient(<WeatherAlert block={block('weatherAlert')} />, queryClient)

        expect(container).toBeEmptyDOMElement()
    })
})
