'use client'

import { motion } from 'framer-motion'

/**
 * スクロールで表示されるセクション（配線確認用）。
 * `whileInView` を使う場合の書き方の見本。
 */
export function ScrollSection() {
    return (
        <section id='section' className='mx-auto max-w-5xl px-6 py-20'>
            <h2 className='text-center text-2xl font-bold sm:text-3xl'>セクション</h2>

            <ul className='mt-12 grid gap-6 sm:grid-cols-3'>
                {[1, 2, 3].map((index) => (
                    <motion.li
                        key={index}
                        initial={{ opacity: 0, y: 16 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true, margin: '-80px' }}
                        transition={{ duration: 0.4, delay: index * 0.05 }}
                        className='rounded-lg border border-border bg-card p-6'
                    >
                        <h3 className='font-semibold'>カード {index}</h3>
                        <p className='mt-2 text-sm text-muted-foreground'>内容が決まったら差し替えてください。</p>
                    </motion.li>
                ))}
            </ul>
        </section>
    )
}
