// @ts-check
import js from '@eslint/js'
import prettier from 'eslint-config-prettier'
import globals from 'globals'
import tseslint from 'typescript-eslint'

/** モノレポ共通の ESLint フラット設定（TS ベース） */
export const baseConfig = tseslint.config(
    {
        ignores: [
            '**/node_modules/**',
            '**/dist/**',
            '**/build/**',
            '**/.next/**',
            '**/.open-next/**',
            '**/.turbo/**',
            '**/.wrangler/**',
            '**/coverage/**',
            '**/playwright-report/**',
            '**/test-results/**',
            '**/*.gen.ts',
        ],
    },
    js.configs.recommended,
    ...tseslint.configs.recommended,
    {
        languageOptions: {
            ecmaVersion: 2023,
            globals: { ...globals.es2021 },
        },
        rules: {
            '@typescript-eslint/no-unused-vars': [
                'error',
                { argsIgnorePattern: '^_', varsIgnorePattern: '^_', caughtErrorsIgnorePattern: '^_' },
            ],
            '@typescript-eslint/consistent-type-imports': [
                'error',
                { prefer: 'type-imports', fixStyle: 'inline-type-imports' },
            ],
            'no-console': ['warn', { allow: ['warn', 'error'] }],
            eqeqeq: ['error', 'smart'],
        },
    },
    {
        files: ['**/*.test.{ts,tsx}', '**/*.spec.{ts,tsx}', '**/e2e/**/*.ts'],
        rules: {
            '@typescript-eslint/no-explicit-any': 'off',
            'no-console': 'off',
        },
    },
    prettier,
)

export default baseConfig
