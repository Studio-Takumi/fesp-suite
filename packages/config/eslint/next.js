// @ts-check
import globals from 'globals'
import tseslint from 'typescript-eslint'

import { baseConfig } from './base.js'

/**
 * Next.js 向け設定。
 * `eslint-config-next` は各アプリ側（依存を持つ側）で読み込んで合成する。
 *   import next from "eslint-config-next";
 *   export default [...nextBaseConfig, ...next];
 */
export const nextBaseConfig = tseslint.config(...baseConfig, {
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
        globals: { ...globals.browser, ...globals.node },
    },
    rules: {
        'react-refresh/only-export-components': 'off',
    },
})

export default nextBaseConfig
