import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

/** shadcn/ui 規約の cn ヘルパー */
export function cn(...inputs: ClassValue[]): string {
    return twMerge(clsx(inputs))
}
