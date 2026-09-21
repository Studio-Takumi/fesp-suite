/**
 * Postgres のエラーコードのうち、API がステータスに読み替えているもの。
 * RLS に判定を任せているので、権限の不足もここに混ざって返ってくる
 */

/** 一意制約に引っかかった（同じ `day` の開催日、同じ名前のタグなど） */
export const UNIQUE_VIOLATION = '23505'

/** 外部キーに引っかかった（参照されている行を消そうとしたなど） */
export const FOREIGN_KEY_VIOLATION = '23503'

/** RLS の with check に通らなかった */
export const INSUFFICIENT_PRIVILEGE = '42501'
