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
    webServer: process.env.E2E_BASE_URL
        ? undefined
        : {
              command: 'bun run build && bun run start',
              url: 'http://localhost:3001',
              reuseExistingServer: !process.env.CI,
              timeout: 180_000,
          },
})
