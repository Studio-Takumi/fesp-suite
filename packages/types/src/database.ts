/**
 * Supabase の生成型の置き場。
 *
 *   bunx supabase gen types typescript --project-id <ref> > packages/types/src/database.generated.ts
 *
 * を実行したら、下の再エクスポートを生成ファイルに差し替える。
 * （プロジェクト未作成のうちは最小の構造だけ置いておく）
 */
export type Json = string | number | boolean | null | { [key: string]: Json } | Json[]

export type Database = {
    public: {
        Tables: Record<
            string,
            { Row: Record<string, Json>; Insert: Record<string, Json>; Update: Record<string, Json> }
        >
        Views: Record<string, never>
        Functions: Record<string, never>
        Enums: Record<string, never>
    }
}

/** テーブル行の型を引くヘルパー */
export type Tables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Row']
