import { Cloud, CloudRain, CloudSun, type LucideIcon, Sun } from 'lucide-react'

import type { WeatherKind } from '~/lib/mock/weather'

/** 天気の種類 → 読み上げる名前・アイコン・アイコンの色 */
export const weatherKinds: Record<WeatherKind, { label: string; Icon: LucideIcon; className: string }> = {
    sunny: { label: '晴れ', Icon: Sun, className: 'text-amber-400' },
    partlyCloudy: { label: '晴れ時々くもり', Icon: CloudSun, className: 'text-amber-400' },
    cloudy: { label: 'くもり', Icon: Cloud, className: 'text-slate-400' },
    rainy: { label: '雨', Icon: CloudRain, className: 'text-sky-500' },
}
