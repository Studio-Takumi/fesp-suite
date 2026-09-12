import { defineConfig, devices } from '@playwright/test'

/**
 * 主要導線の通しテスト。
 * 既定ではローカルの dev サーバーを自動起動する。
 * API のレスポンスは spec 側で `page.route()` からスタブしている。
 */
export default defineConfig({
    testDir: './e2e',
    fullyParallel: true,
    forbidOnly: Boolean(process.env.CI),
    retries: process.env.CI ? 2 : 0,
    workers: process.env.CI ? 1 : undefined,
    reporter: process.env.CI ? 'github' : 'html',
    use: {
        baseURL: process.env.E2E_BASE_URL ?? 'http://localhost:5173',
        trace: 'on-first-retry',
        locale: 'ja-JP',
        timezoneId: 'Asia/Tokyo',
    },
    projects: [
        { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
        { name: 'mobile-safari', use: { ...devices['iPhone 14'] } },
    ],
    webServer: process.env.E2E_BASE_URL
        ? undefined
        : {
              command: 'bun run dev',
              url: 'http://localhost:5173',
              reuseExistingServer: !process.env.CI,
              timeout: 120_000,
          },
})
