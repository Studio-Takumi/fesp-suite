'use client'

import Link from 'next/link'

import { motion, useReducedMotion } from 'framer-motion'
import { ArrowRight } from 'lucide-react'

/**
 * ファーストビュー（配線確認用の仮コンテンツ）。
 * Framer Motion のアニメーションが動くことを確認できる。
 * サービス名・コピーが決まったら差し替える。
 */
export function Hero() {
    const shouldReduceMotion = useReducedMotion()
    const fadeUp = shouldReduceMotion
        ? { initial: { opacity: 1, y: 0 }, animate: { opacity: 1, y: 0 } }
        : { initial: { opacity: 0, y: 24 }, animate: { opacity: 1, y: 0 } }

    return (
        <section className='mx-auto max-w-4xl px-6 py-24 text-center'>
            <motion.h1
                {...fadeUp}
                transition={{ duration: 0.6, ease: 'easeOut' }}
                className='text-4xl leading-tight font-bold text-balance sm:text-5xl'
            >
                LPサイト
            </motion.h1>

            <motion.p
                {...fadeUp}
                transition={{ duration: 0.6, delay: 0.1, ease: 'easeOut' }}
                className='mx-auto mt-6 max-w-2xl text-pretty text-muted-foreground'
            >
                サービス紹介ページの雛形です。Next.js + Tailwind + Framer Motion の配線確認用に、
                フェードインするだけのセクションを置いています。
            </motion.p>

            <motion.div
                {...fadeUp}
                transition={{ duration: 0.6, delay: 0.2, ease: 'easeOut' }}
                className='mt-10 flex justify-center gap-3'
            >
                <Link
                    href='#section'
                    className='inline-flex h-12 items-center gap-2 rounded-md bg-primary px-6 font-medium text-primary-foreground'
                >
                    次のセクションへ
                    <ArrowRight aria-hidden className='size-4' />
                </Link>
            </motion.div>
        </section>
    )
}
