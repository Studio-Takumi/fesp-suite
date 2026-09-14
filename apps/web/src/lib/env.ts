import { z } from 'zod'

/** 起動時に環境変数を検証する（設定漏れをすぐ気付けるようにする） */
const envSchema = z.object({
    VITE_API_URL: z.url(),
    VITE_SUPABASE_URL: z.url(),
    VITE_SUPABASE_ANON_KEY: z.string().min(1),
    VITE_PARTYKIT_HOST: z.string().min(1).optional(),
    /** 表示するイベントの ID（events.id） */
    VITE_EVENT_ID: z.uuid(),
})

export const env = envSchema.parse({
    VITE_API_URL: import.meta.env.VITE_API_URL,
    VITE_SUPABASE_URL: import.meta.env.VITE_SUPABASE_URL,
    VITE_SUPABASE_ANON_KEY: import.meta.env.VITE_SUPABASE_ANON_KEY,
    VITE_PARTYKIT_HOST: import.meta.env.VITE_PARTYKIT_HOST,
    VITE_EVENT_ID: import.meta.env.VITE_EVENT_ID,
})
