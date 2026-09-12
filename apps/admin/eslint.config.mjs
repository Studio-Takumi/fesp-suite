import next from '@fesp/config/eslint/next'

export default [
    ...next,
    {
        ignores: ['.next/**', '.open-next/**', 'next-env.d.ts'],
    },
]
