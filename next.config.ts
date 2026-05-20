import type { NextConfig } from 'next'

const config: NextConfig = {
  // Supabase image domains (if you ever add avatars)
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '*.supabase.co' },
    ],
  },
}

export default config
