// @ts-check
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import globals from 'globals'
import tseslint from 'typescript-eslint'

import { baseConfig } from './base.js'

/** React (Vite SPA / ライブラリ) 向け設定 */
export const reactConfig = tseslint.config(...baseConfig, {
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
        globals: { ...globals.browser },
    },
    plugins: {
        'react-hooks': reactHooks,
        'react-refresh': reactRefresh,
    },
    rules: {
        ...reactHooks.configs.recommended.rules,
        'react-refresh/only-export-components': ['warn', { allowConstantExport: true }],
    },
})

export default reactConfig
