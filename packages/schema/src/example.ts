import { z } from 'zod'

/**
 * 配線確認用のサンプルスキーマ（ドメインが決まったら置き換える）。
 *
 * このパッケージの使い方の見本:
 *   フロント → useForm({ resolver: zodResolver(exampleInputSchema) })
 *   API      → zValidator("json", exampleInputSchema, validationHook)
 *
 * 同じ定義を両側で使うことで、「フロントは通ったのにAPIで弾かれる」ズレを防ぐ。
 */
export const exampleInputSchema = z.object({
    name: z.string().min(1, '名前は必須です').max(50, '名前は50文字以内で入力してください'),
    email: z.email('メールアドレスの形式が正しくありません'),
    note: z.string().max(200, 'メモは200文字以内で入力してください').default(''),
})
export type ExampleInput = z.infer<typeof exampleInputSchema>

/** サンプルのレスポンス（GET /api/example） */
export const exampleResponseSchema = z.object({
    message: z.string(),
    now: z.iso.datetime({ offset: true }),
})
export type ExampleResponse = z.infer<typeof exampleResponseSchema>
