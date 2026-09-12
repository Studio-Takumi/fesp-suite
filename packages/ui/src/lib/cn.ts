import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

/** Tailwind のクラス衝突を解決しつつ結合する */
export function cn(...inputs: ClassValue[]): string {
    return twMerge(clsx(inputs))
}
