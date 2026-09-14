/**
 * Supabase の生成型の置き場。マイグレーションを適用したら再生成する。
 *
 *   bunx supabase gen types typescript --linked --schema public > packages/types/src/database.generated.ts
 */
export type { CompositeTypes, Database, Enums, Json, Tables, TablesInsert, TablesUpdate } from './database.generated'
