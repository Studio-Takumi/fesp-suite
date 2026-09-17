import { z } from 'zod'

import { paginationQuerySchema, timestampSchema, uuidSchema } from './common'

/**
 * 記事ドキュメント（BlockNoteのブロック配列JSON）のzodスキーマ。
 *
 * `#5` 時点ではテキスト系ブロック（paragraph/heading/bulletListItem/numberedListItem/
 * checkListItem/toggleListItem/quote/divider/table/codeBlock）のみを対象にする。
 * codeBlockはスラッシュメニューには出さない裏機能（ArticleEditor.tsx参照）。
 * 独自コンポーネントブロック（`pageHeader` など）は props だけを持つ（docs/article-system.md 参照）。
 * ブロックの形はBlockNoteの `Block` 型（@blocknote/core）に合わせている。
 */

const colorSchema = z.enum(['default', 'gray', 'brown', 'red', 'orange', 'yellow', 'green', 'blue', 'purple', 'pink'])

const textAlignmentSchema = z.enum(['left', 'center', 'right', 'justify'])

const stylesSchema = z.object({
    bold: z.literal(true).optional(),
    italic: z.literal(true).optional(),
    underline: z.literal(true).optional(),
    strike: z.literal(true).optional(),
    code: z.literal(true).optional(),
    textColor: colorSchema.optional(),
    backgroundColor: colorSchema.optional(),
})
export type ArticleStyles = z.infer<typeof stylesSchema>

const styledTextSchema = z.object({
    type: z.literal('text'),
    text: z.string().min(1),
    styles: stylesSchema,
})
export type ArticleStyledText = z.infer<typeof styledTextSchema>

const linkSchema = z.object({
    type: z.literal('link'),
    href: z.url(),
    content: z.array(styledTextSchema),
})
export type ArticleLink = z.infer<typeof linkSchema>

const inlineContentSchema = z.array(z.union([styledTextSchema, linkSchema]))

const blockPropsSchema = z
    .object({
        backgroundColor: colorSchema,
        textColor: colorSchema,
        textAlignment: textAlignmentSchema,
    })
    .strict()

const headingPropsSchema = blockPropsSchema
    .extend({
        level: z.union([z.literal(1), z.literal(2), z.literal(3), z.literal(4), z.literal(5), z.literal(6)]),
        isToggleable: z.boolean().optional(),
    })
    .strict()

const numberedListItemPropsSchema = blockPropsSchema
    .extend({
        start: z.number().int().min(1).optional(),
    })
    .strict()

const checkListItemPropsSchema = blockPropsSchema
    .extend({
        checked: z.boolean(),
    })
    .strict()

/** quoteは他のテキスト系ブロックと違い、textAlignmentを持たない（BlockNoteの仕様） */
const quotePropsSchema = z
    .object({
        backgroundColor: colorSchema,
        textColor: colorSchema,
    })
    .strict()

const dividerPropsSchema = z.object({}).strict()

/** tableは列単位の背景色・配置を持たない（セル側の`tableCell`が持つ） */
const tablePropsSchema = z
    .object({
        textColor: colorSchema,
    })
    .strict()

const tableCellPropsSchema = z
    .object({
        backgroundColor: colorSchema,
        textColor: colorSchema,
        textAlignment: textAlignmentSchema,
        colspan: z.number().int().min(1).optional(),
        rowspan: z.number().int().min(1).optional(),
    })
    .strict()

const codeBlockPropsSchema = z
    .object({
        language: z.string(),
    })
    .strict()

/**
 * ページ見出し（`pageHeader`）の props。管理者サイトのサイドパネルのフォームでもこのスキーマで検証する。
 * BlockNote の props にそのまま入る値なので、trim などの変換はかけない
 */
export const pageHeaderPropsSchema = z
    .object({
        /** 英語ラベル（例: `NEWS`）。表示時に大文字にする */
        label: z.string().max(30, '英語ラベルは30文字以内で入力してください'),
        /** 日本語タイトル（例: `お知らせ`） */
        title: z.string().max(50, '日本語タイトルは50文字以内で入力してください'),
    })
    .strict()
export type PageHeaderProps = z.infer<typeof pageHeaderPropsSchema>

/**
 * お知らせ一覧（`newsList`）の props。
 * BlockNote の props は文字列・数値・真偽値しか持てないので、タブに出すタグは ID をカンマ区切りで並べた文字列で持つ
 */
export const newsListPropsSchema = z
    .object({
        /** タグのタブを出すか */
        showTagTabs: z.boolean(),
        /** タブに出すタグの ID をカンマ区切りで並べた文字列（例: `stage,shop`）。空文字なら選んでいない */
        tags: z.string().regex(/^([^,]+(,[^,]+)*)?$/, 'タグの指定が正しくありません'),
        /** 表示件数。無ければ全件。BlockNote は未設定の値を `undefined` にし、JSON を経由するとキーごと消える */
        limit: z
            .number('表示件数は1以上の整数で入力してください')
            .int('表示件数は1以上の整数で入力してください')
            .min(1, '表示件数は1以上の整数で入力してください')
            .optional(),
        /** 「すべて見る」を出すか */
        showViewAll: z.boolean(),
    })
    .strict()
export type NewsListProps = z.infer<typeof newsListPropsSchema>

/** お知らせ一覧の props の `tags` を、タグの ID の配列にする */
export function parseNewsListTags(tags: string): string[] {
    return tags === '' ? [] : tags.split(',')
}

/** 記事の画像（`coverImage`）の props */
export const coverImagePropsSchema = z
    .object({
        /** 画像の URL。空文字なら画像を出さない */
        imageUrl: z.union([
            z.literal(''),
            z.url({ protocol: /^https?$/, error: 'http:// か https:// で始まる URL を入力してください' }),
        ]),
    })
    .strict()
export type CoverImageProps = z.infer<typeof coverImagePropsSchema>

/**
 * props を持たない独自コンポーネント（記事のサマリー・前後の記事・天気の各ブロックなど）の props。
 * 表示するデータはコンポーネントが自分で読むので、記事には何も持たせない
 */
export const emptyComponentPropsSchema = z.object({}).strict()
export type EmptyComponentProps = z.infer<typeof emptyComponentPropsSchema>

/** 天気の独自コンポーネント。どれも props を持たない（docs/app.md の「天気のブロック」参照） */
export const weatherComponentTypes = [
    'todayWeather',
    'weeklyForecast',
    'weatherAlert',
    'wbgt',
    'weatherOverview',
    'weatherCredit',
] as const
export type WeatherComponentType = (typeof weatherComponentTypes)[number]

/** スケジュール表（`scheduleTable`）の props。管理者サイトのサイドパネルのフォームでもこのスキーマで検証する */
export const scheduleTablePropsSchema = z
    .object({
        /** 日付タブを出すか。出さないときは1日目のタイムテーブルを出す */
        showDateTabs: z.boolean(),
    })
    .strict()
export type ScheduleTableProps = z.infer<typeof scheduleTablePropsSchema>

/** コードブロックの中身はスタイル（太字等）を持たない「プレーンテキスト」 */
const plainTextSchema = z.object({
    type: z.literal('text'),
    text: z.string().min(1),
    styles: z.object({}).strict(),
})
const plainContentSchema = z.array(plainTextSchema)

const tableCellSchema = z.object({
    type: z.literal('tableCell'),
    props: tableCellPropsSchema,
    content: inlineContentSchema,
})
export type ArticleTableCell = z.infer<typeof tableCellSchema>

const tableContentSchema = z.object({
    type: z.literal('tableContent'),
    /**
     * 列幅を変えていない列はBlockNoteが`undefined`を入れ、JSONを経由すると`null`になる。
     * BlockNoteの型は`null`を許さないため、`undefined`に戻す
     */
    columnWidths: z.array(
        z
            .number()
            .nullish()
            .transform((width) => width ?? undefined),
    ),
    headerRows: z.number().int().min(0).optional(),
    headerCols: z.number().int().min(0).optional(),
    rows: z.array(z.object({ cells: z.array(tableCellSchema) })),
})
export type ArticleTableContent = z.infer<typeof tableContentSchema>

export type ArticleBlock = {
    id: string
    type:
        | 'paragraph'
        | 'heading'
        | 'bulletListItem'
        | 'numberedListItem'
        | 'checkListItem'
        | 'toggleListItem'
        | 'quote'
        | 'divider'
        | 'table'
        | 'codeBlock'
        | 'pageHeader'
        | 'scheduleTable'
        | 'newsList'
        | 'coverImage'
        | 'postSummary'
        | 'adjacentPosts'
        | WeatherComponentType
    props: Record<string, unknown>
    content?: (ArticleStyledText | ArticleLink)[] | ArticleTableContent
    children: ArticleBlock[]
}

const articleBlockSchema: z.ZodType<ArticleBlock> = z.lazy(() =>
    z.union([
        z.object({
            id: z.string().min(1),
            type: z.literal('paragraph'),
            props: blockPropsSchema,
            content: inlineContentSchema,
            children: z.array(articleBlockSchema),
        }),
        z.object({
            id: z.string().min(1),
            type: z.literal('heading'),
            props: headingPropsSchema,
            content: inlineContentSchema,
            children: z.array(articleBlockSchema),
        }),
        z.object({
            id: z.string().min(1),
            type: z.literal('bulletListItem'),
            props: blockPropsSchema,
            content: inlineContentSchema,
            children: z.array(articleBlockSchema),
        }),
        z.object({
            id: z.string().min(1),
            type: z.literal('numberedListItem'),
            props: numberedListItemPropsSchema,
            content: inlineContentSchema,
            children: z.array(articleBlockSchema),
        }),
        z.object({
            id: z.string().min(1),
            type: z.literal('checkListItem'),
            props: checkListItemPropsSchema,
            content: inlineContentSchema,
            children: z.array(articleBlockSchema),
        }),
        z.object({
            id: z.string().min(1),
            type: z.literal('toggleListItem'),
            props: blockPropsSchema,
            content: inlineContentSchema,
            children: z.array(articleBlockSchema),
        }),
        z.object({
            id: z.string().min(1),
            type: z.literal('quote'),
            props: quotePropsSchema,
            content: inlineContentSchema,
            children: z.array(articleBlockSchema),
        }),
        z.object({
            id: z.string().min(1),
            type: z.literal('divider'),
            props: dividerPropsSchema,
            /** BlockNoteは`content: undefined`を入れるが、JSONを経由するとキーごと消える */
            content: z.undefined().optional(),
            children: z.array(articleBlockSchema),
        }),
        z.object({
            id: z.string().min(1),
            type: z.literal('table'),
            props: tablePropsSchema,
            content: tableContentSchema,
            children: z.array(articleBlockSchema),
        }),
        z.object({
            id: z.string().min(1),
            type: z.literal('codeBlock'),
            props: codeBlockPropsSchema,
            content: plainContentSchema,
            children: z.array(articleBlockSchema),
        }),
        z.object({
            id: z.string().min(1),
            type: z.literal('pageHeader'),
            props: pageHeaderPropsSchema,
            /** 独自コンポーネントは中身を持たない。JSONを経由すると`content`キーごと消える */
            content: z.undefined().optional(),
            children: z.array(articleBlockSchema),
        }),
        z.object({
            id: z.string().min(1),
            type: z.literal('scheduleTable'),
            props: scheduleTablePropsSchema,
            content: z.undefined().optional(),
            children: z.array(articleBlockSchema),
        }),
        z.object({
            id: z.string().min(1),
            type: z.literal('newsList'),
            props: newsListPropsSchema,
            content: z.undefined().optional(),
            children: z.array(articleBlockSchema),
        }),
        z.object({
            id: z.string().min(1),
            type: z.literal('coverImage'),
            props: coverImagePropsSchema,
            content: z.undefined().optional(),
            children: z.array(articleBlockSchema),
        }),
        emptyComponentBlockSchema('postSummary'),
        emptyComponentBlockSchema('adjacentPosts'),
        emptyComponentBlockSchema('todayWeather'),
        emptyComponentBlockSchema('weeklyForecast'),
        emptyComponentBlockSchema('weatherAlert'),
        emptyComponentBlockSchema('wbgt'),
        emptyComponentBlockSchema('weatherOverview'),
        emptyComponentBlockSchema('weatherCredit'),
    ]),
)

/** props を持たない独自コンポーネントのブロック。中身も持たない（JSONを経由すると`content`キーごと消える） */
function emptyComponentBlockSchema<Type extends string>(type: Type) {
    return z.object({
        id: z.string().min(1),
        type: z.literal(type),
        props: emptyComponentPropsSchema,
        content: z.undefined().optional(),
        children: z.array(articleBlockSchema),
    })
}

/** 記事ドキュメント全体の形。BlockNoteの `Block[]`（トップレベルは配列で、`doc` のようなルートノードは無い） */
export const articleDocumentSchema = z.array(articleBlockSchema)
export type ArticleDocument = z.infer<typeof articleDocumentSchema>

/** 記事のタイトル。空文字も許す */
export const articleTitleSchema = z.string().trim().max(100, 'タイトルは100文字以内で入力してください')

/** 記事の作成者。`users` から埋め込んで返す */
export const articleCreatorSchema = z.object({
    /** 未設定なら `null` */
    display_name: z.string().nullable(),
})
export type ArticleCreator = z.infer<typeof articleCreatorSchema>

/** 記事の公開状態。`draft`（下書き）/ `published`（公開） */
export const articleStatusSchema = z.enum(['draft', 'published'])
export type ArticleStatus = z.infer<typeof articleStatusSchema>

/** 記事の版（`article_histories` の1行）。保存のたびに残る編集履歴 */
export const articleHistorySchema = z.object({
    /** 記事ごとに1から増える番号 */
    version: z.number().int().min(1),
    title: z.string(),
    content: articleDocumentSchema,
    /** その版を保存したユーザー。`service_role` から保存したときは `null` */
    created_by: uuidSchema.nullable(),
    created_at: timestampSchema,
    updated_at: timestampSchema,
})
export type ArticleHistory = z.infer<typeof articleHistorySchema>

/** 記事の予約（`article_schedules` の1行）。時間が来たら、予約した版を公開中の版にする */
export const articleScheduleSchema = z.object({
    /** 公開する版の番号 */
    version: z.number().int().min(1),
    /** 公開する日時 */
    publish_at: timestampSchema,
    /** 予約したユーザー。`service_role` から予約したときは `null` */
    created_by: uuidSchema.nullable(),
    created_at: timestampSchema,
    updated_at: timestampSchema,
})
export type ArticleSchedule = z.infer<typeof articleScheduleSchema>

/** 記事オブジェクト（GET /api/articles/:id などのレスポンス） */
export const articleResponseSchema = z.object({
    id: uuidSchema,
    event_id: uuidSchema,
    created_by: uuidSchema,
    creator: articleCreatorSchema,
    /** 公開中なら公開している版の、下書きなら最新の版のタイトル */
    title: z.string(),
    /** 公開中なら公開している版の、下書きなら最新の版の本文 */
    content: articleDocumentSchema,
    status: articleStatusSchema,
    /** 公開中の版の番号。下書きなら `null` */
    published_version: z.number().int().min(1).nullable(),
    /** 初めて公開した日時。一度も公開していなければ `null` */
    published_at: timestampSchema.nullable(),
    created_at: timestampSchema,
    updated_at: timestampSchema,
    /** 最新の版。公開中の記事を一時保存した変更はここにだけ入る。イベントの `staff` でなければ `null` */
    latest_history: articleHistorySchema.nullable(),
    /** 予約。予約が無い、またはイベントの `staff` でなければ `null` */
    schedule: articleScheduleSchema.nullable(),
})
export type ArticleResponse = z.infer<typeof articleResponseSchema>

/**
 * 表示用に記事ドキュメントを読む。ブロックを1つずつ検証し、形の合わないブロック（知らない `type` を含む）は
 * 子ブロックごと取り除く。子ブロックは親とは別に検証するので、壊れた子だけが抜ける。
 * 新しいブロックを含む記事を古いクライアントが開いても、残りを描画できるようにするため（前方互換）
 */
export function parseArticleDocument(blocks: unknown[]): ArticleDocument {
    return blocks.flatMap((block) => {
        if (typeof block !== 'object' || block === null) return []

        const { children, ...rest } = block as Record<string, unknown>
        if (!Array.isArray(children)) return []

        const result = articleBlockSchema.safeParse({ ...rest, children: [] })
        if (!result.success) return []

        return [{ ...result.data, children: parseArticleDocument(children) }]
    })
}

/**
 * ウェブアプリで表示するときの記事オブジェクト。本文は `parseArticleDocument` で描画できるブロックだけにする。
 * 最新の版（`latest_history`）は表示に使わないので持たない（staff が開いたときに、版の本文の検証で落とさないため）。
 * 予約（`schedule`）も表示に使わないので持たない
 */
export const articleViewResponseSchema = articleResponseSchema.omit({ latest_history: true, schedule: true }).extend({
    content: z.array(z.unknown()).transform(parseArticleDocument),
})
export type ArticleViewResponse = z.infer<typeof articleViewResponseSchema>

/** 一覧の1行。本文（content）と最新の版（latest_history）は返さない */
export const articleListItemSchema = articleResponseSchema.omit({ content: true, latest_history: true })
export type ArticleListItem = z.infer<typeof articleListItemSchema>

/** GET /api/articles のレスポンス */
export const articleListResponseSchema = z.object({
    items: z.array(articleListItemSchema),
    limit: z.number().int(),
    offset: z.number().int(),
})
export type ArticleListResponse = z.infer<typeof articleListResponseSchema>

/** 対象イベントを指定するクエリ */
export const articleEventQuerySchema = z.object({
    event_id: uuidSchema,
})
export type ArticleEventQuery = z.infer<typeof articleEventQuerySchema>

/** GET /api/articles のクエリ */
export const articleListQuerySchema = paginationQuerySchema.extend(articleEventQuerySchema.shape)
export type ArticleListQuery = z.infer<typeof articleListQuerySchema>

/** 記事IDのパスパラメータ */
export const articleIdParamSchema = z.object({
    id: uuidSchema,
})

/** PUT /api/articles/:id のリクエストボディ。記事のイベントは変えられないので `event_id` を持たない */
export const articleInputSchema = z.object({
    title: articleTitleSchema,
    content: articleDocumentSchema,
    /** 保存後の公開状態。省略すると公開状態を変えない（公開中の記事なら一時保存になる） */
    status: articleStatusSchema.optional(),
})
export type ArticleInput = z.infer<typeof articleInputSchema>

/** POST /api/articles のリクエストボディ。記事は下書きで作るので `status` を持たない */
export const articleCreateInputSchema = articleInputSchema.omit({ status: true }).extend(articleEventQuerySchema.shape)
export type ArticleCreateInput = z.infer<typeof articleCreateInputSchema>

/** 予約する日時。現在より後だけ受け付ける */
export const articlePublishAtSchema = timestampSchema.refine(
    (value) => new Date(value).getTime() > Date.now(),
    '現在より後の日時を指定してください',
)

/** PUT /api/articles/:id/schedule のリクエストボディ */
export const articleScheduleInputSchema = z.object({
    /** 公開する版の番号 */
    version: z.number().int().min(1),
    /** その版の `updated_at`。読み込んだ値をそのまま送る（そのあとの保存で版が上書きされていたら 409） */
    version_updated_at: timestampSchema,
    /** 公開する日時 */
    publish_at: articlePublishAtSchema,
})
export type ArticleScheduleInput = z.infer<typeof articleScheduleInputSchema>
