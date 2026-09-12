import { defineConfig, devices } from '@playwright/test'

/** LP は表示中心。主要導線と表示崩れのみを見る（アニメーションは追わない） */
export default defineConfig({
    testDir: './e2e',
    fullyParallel: true,
    forbidOnly: Boolean(process.env.CI),
    retries: process.env.CI ? 2 : 0,
    reporter: process.env.CI ? 'github' : 'html',
    use: {
        baseURL: process.env.E2E_BASE_URL ?? 'http://localhost:3000',
        trace: 'on-first-retry',
        locale: 'ja-JP',
    },
    projects: [
        { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
        { name: 'mobile-safari', use: { ...devices['iPhone 14'] } },
    ],
    webServer: process.env.E2E_BASE_URL
        ? undefined
        : {
              command: 'bun run build && bun run start',
              url: 'http://localhost:3000',
              reuseExistingServer: !process.env.CI,
              timeout: 180_000,
          },
})
