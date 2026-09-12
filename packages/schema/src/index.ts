/**
 * @fesp/schema — フロント（React Hook Form）と API（Hono）で共有する zod スキーマ。
 *
 * ここが唯一の正本。バリデーションが必要になったら、
 * まずこのパッケージに定義してから両側で import する。
 */
export * from './common'
export * from './auth'
export * from './example'
