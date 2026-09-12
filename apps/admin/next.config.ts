import type { NextConfig } from 'next'

import { initOpenNextCloudflareForDev } from '@opennextjs/cloudflare'

const nextConfig: NextConfig = {
    reactStrictMode: true,
    transpilePackages: ['@fesp/ui', '@fesp/schema', '@fesp/types'],
}

export default nextConfig

void initOpenNextCloudflareForDev()
