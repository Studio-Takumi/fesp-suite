import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
    testDir: './e2e',
    fullyParallel: false,
    forbidOnly: Boolean(process.env.CI),
    retries: process.env.CI ? 2 : 0,
    reporter: process.env.CI ? 'github' : 'html',
    use: {
        baseURL: process.env.E2E_BASE_URL ?? 'http://localhost:3001',
        trace: 'on-first-retry',
        locale: 'ja-JP',
        timezoneId: 'Asia/Tokyo',
    },
    projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
    // いまは全テストが skip なのでサーバーを立てない。立てると Next を
    // フルビルドするだけで1件も走らない。エディタ画面ができて
    // collaborative-editing.spec.ts の skip を外すときに、下を戻す。
    //
    // webServer: process.env.E2E_BASE_URL
    //     ? undefined
    //     : {
    //           command: 'bun run build && bun run start',
    //           url: 'http://localhost:3001',
    //           reuseExistingServer: !process.env.CI,
    //           timeout: 180_000,
    //       },
})
