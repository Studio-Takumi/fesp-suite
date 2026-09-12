// Cloudflare Workers 上で `next dev` のバインディングを使えるようにする
import type { NextConfig } from 'next'

import { initOpenNextCloudflareForDev } from '@opennextjs/cloudflare'

const nextConfig: NextConfig = {
    reactStrictMode: true,
    // モノレポの共通パッケージはソースのまま配布しているのでトランスパイルする
    transpilePackages: ['@fesp/ui', '@fesp/schema', '@fesp/types'],
    images: {
        // R2 の公開ドメインを追加する
        remotePatterns: [{ protocol: 'https', hostname: '**.r2.dev' }],
    },
}

export default nextConfig

void initOpenNextCloudflareForDev()
