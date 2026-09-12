import react from '@fesp/config/eslint/react'

export default [
    ...react,
    {
        // ライブラリパッケージなので Fast Refresh の制約は対象外
        rules: {
            'react-refresh/only-export-components': 'off',
        },
    },
]
