import type { ReactNode } from 'react'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { fireEvent, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import type { ArticleDocument, ArticleResponse } from '@fesp/schema'
import { ApiError } from '@fesp/types'

import { ArticleEditView } from './ArticleEditView'

const EVENT_ID = '0b7e6d5c-4a3b-4c2d-9e1f-a2b3c4d5e6f7'
const ARTICLE_ID = '7f1c2a9e-3b4d-4e5f-8a6b-1c2d3e4f5a6b'
const USER_ID = '3c9d1e2f-4a5b-4c6d-8e7f-9a0b1c2d3e4f'

const adminFetch = vi.fn()

vi.mock('~/lib/env', () => ({ env: { NEXT_PUBLIC_EVENT_ID: '0b7e6d5c-4a3b-4c2d-9e1f-a2b3c4d5e6f7' } }))
vi.mock('~/lib/api', () => ({ adminFetch: (...args: unknown[]) => adminFetch(...args) }))

function renderWithQueryClient(ui: ReactNode) {
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
    return render(<QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>)
}

function paragraph(text: string): ArticleDocument {
    return [
        {
            id: '1',
            type: 'paragraph',
            props: { backgroundColor: 'default', textColor: 'default', textAlignment: 'left' },
            content: [{ type: 'text', text, styles: {} }],
            children: [],
        },
    ]
}

/** 下書きの記事。最新の版（版1）は記事と同じ中身 */
const article: ArticleResponse = {
    id: ARTICLE_ID,
    event_id: EVENT_ID,
    created_by: USER_ID,
    creator: { display_name: '山田太郎' },
    status: 'draft',
    published_version: null,
    published_at: null,
    title: '模擬店のお知らせ',
    content: paragraph('現金のみです。'),
    created_at: '2026-09-14T01:00:00+00:00',
    updated_at: '2026-09-14T03:30:00+00:00',
    latest_history: {
        version: 1,
        title: '模擬店のお知らせ',
        content: paragraph('現金のみです。'),
        created_by: USER_ID,
        created_at: '2026-09-14T01:00:00+00:00',
        updated_at: '2026-09-14T03:30:00+00:00',
    },
    schedule: null,
}

/** 公開中の記事。版1を公開していて、一時保存した変更は無い */
const publishedArticle: ArticleResponse = {
    ...article,
    status: 'published',
    published_version: 1,
    published_at: '2026-09-14T02:00:00+00:00',
}

/** 公開中の記事に、版2を一時保存したもの */
const temporarilySavedArticle: ArticleResponse = {
    ...publishedArticle,
    latest_history: {
        version: 2,
        title: '2日目のお知らせ',
        content: paragraph('一時保存した本文です。'),
        created_by: USER_ID,
        created_at: '2026-09-14T04:00:00+00:00',
        updated_at: '2026-09-14T04:10:00+00:00',
    },
}

const articlePath = `/api/articles/${ARTICLE_ID}`

type FetchOptions = { method?: string; body?: unknown }

function putCalls() {
    return adminFetch.mock.calls.filter(([, , options]) => (options as FetchOptions | undefined)?.method === 'PUT')
}

function putBodies() {
    return putCalls().map(([, , options]) => (options as FetchOptions).body)
}

describe('ArticleEditView', () => {
    beforeEach(() => {
        adminFetch.mockReset()
    })

    it('記事を読み込んでタイトルの入力欄とエディタの初期値にする', async () => {
        adminFetch.mockResolvedValue(article)

        renderWithQueryClient(<ArticleEditView id={ARTICLE_ID} />)

        expect(await screen.findByText('現金のみです。')).toBeInTheDocument()
        expect(screen.getByRole('textbox', { name: 'タイトル' })).toHaveValue('模擬店のお知らせ')
        expect(adminFetch).toHaveBeenCalledWith(
            articlePath,
            expect.anything(),
            expect.objectContaining({ authenticated: true }),
        )
    })

    it('最新の版（一時保存した変更）のタイトル・本文を初期値にする', async () => {
        adminFetch.mockResolvedValue(temporarilySavedArticle)

        renderWithQueryClient(<ArticleEditView id={ARTICLE_ID} />)

        expect(await screen.findByText('一時保存した本文です。')).toBeInTheDocument()
        expect(screen.queryByText('現金のみです。')).not.toBeInTheDocument()
        expect(screen.getByRole('textbox', { name: 'タイトル' })).toHaveValue('2日目のお知らせ')
    })

    it('最新の版が無ければ、記事のタイトル・本文を初期値にする', async () => {
        adminFetch.mockResolvedValue({ ...article, latest_history: null })

        renderWithQueryClient(<ArticleEditView id={ARTICLE_ID} />)

        expect(await screen.findByText('現金のみです。')).toBeInTheDocument()
        expect(screen.getByRole('textbox', { name: 'タイトル' })).toHaveValue('模擬店のお知らせ')
    })

    it.each([
        ['山田太郎', '作成者: 山田太郎'],
        [null, '作成者: （名前未設定）'],
    ])('見出しの下に作成者を出す（表示名: %s）', async (displayName, text) => {
        adminFetch.mockResolvedValue({ ...article, creator: { display_name: displayName } })

        renderWithQueryClient(<ArticleEditView id={ARTICLE_ID} />)

        expect(await screen.findByText(text)).toBeInTheDocument()
    })

    it('公開中の記事で、最新の版が公開中の版と違うと「公開していない変更があります」と出す', async () => {
        adminFetch.mockResolvedValue(temporarilySavedArticle)

        renderWithQueryClient(<ArticleEditView id={ARTICLE_ID} />)

        expect(await screen.findByText('公開していない変更があります')).toBeInTheDocument()
    })

    it.each([
        ['公開中の版が最新の版', publishedArticle],
        ['下書きの記事', article],
    ])('%sなら「公開していない変更があります」を出さない', async (_label, fixture) => {
        adminFetch.mockResolvedValue(fixture)

        renderWithQueryClient(<ArticleEditView id={ARTICLE_ID} />)
        await screen.findByText('現金のみです。')

        expect(screen.queryByText('公開していない変更があります')).not.toBeInTheDocument()
    })

    it('記事が見つからないと、エディタの代わりに一覧へのリンクを出す', async () => {
        adminFetch.mockRejectedValue(new ApiError(404, 'not_found', '記事が見つかりません'))

        renderWithQueryClient(<ArticleEditView id={ARTICLE_ID} />)

        expect(await screen.findByText('記事が見つかりません')).toBeInTheDocument()
        expect(screen.getByRole('link', { name: '記事一覧へ戻る' })).toHaveAttribute('href', '/articles')
        expect(screen.queryByLabelText('本文エディタ')).not.toBeInTheDocument()
    })

    it('保存ボタンでタイトル・本文・公開状態を PUT し、成功したら「保存しました」と出す', async () => {
        adminFetch.mockResolvedValue(article)

        renderWithQueryClient(<ArticleEditView id={ARTICLE_ID} />)
        await screen.findByText('現金のみです。')

        await userEvent.click(screen.getByRole('button', { name: '保存' }))

        expect(await screen.findByText('保存しました')).toBeInTheDocument()
        expect(adminFetch).toHaveBeenCalledWith(articlePath, expect.anything(), {
            method: 'PUT',
            body: { title: '模擬店のお知らせ', content: article.content, status: 'draft' },
            authenticated: true,
        })
    })

    it('書き換えたタイトルを前後の空白を除いて保存する。空のタイトルでも保存できる', async () => {
        adminFetch.mockResolvedValue(article)

        renderWithQueryClient(<ArticleEditView id={ARTICLE_ID} />)
        await screen.findByText('現金のみです。')
        const titleInput = screen.getByRole('textbox', { name: 'タイトル' })

        await userEvent.clear(titleInput)
        await userEvent.type(titleInput, '  2日目のお知らせ ')
        await userEvent.click(screen.getByRole('button', { name: '保存' }))
        await screen.findByText('保存しました')

        await userEvent.clear(titleInput)
        await userEvent.click(screen.getByRole('button', { name: '保存' }))
        await screen.findByText('保存しました')

        expect(putCalls().map(([, , options]) => (options as { body: { title: string } }).body.title)).toEqual([
            '2日目のお知らせ',
            '',
        ])
    })

    it('タイトルを編集すると「保存しました」を消す', async () => {
        adminFetch.mockResolvedValue(article)

        renderWithQueryClient(<ArticleEditView id={ARTICLE_ID} />)
        await screen.findByText('現金のみです。')
        await userEvent.click(screen.getByRole('button', { name: '保存' }))
        await screen.findByText('保存しました')

        await userEvent.type(screen.getByRole('textbox', { name: 'タイトル' }), '！')

        expect(screen.queryByText('保存しました')).not.toBeInTheDocument()
    })

    it.each([
        ['draft', 'false'],
        ['published', 'true'],
    ] as const)('公開のスイッチの初期値を記事の公開状態にする（%s）', async (status, checked) => {
        adminFetch.mockResolvedValue({ ...article, status })

        renderWithQueryClient(<ArticleEditView id={ARTICLE_ID} />)
        await screen.findByText('現金のみです。')

        expect(screen.getByRole('switch', { name: '公開' })).toHaveAttribute('aria-checked', checked)
    })

    it('下書きの記事は、公開のスイッチを切り替えただけでは保存せず、保存ボタンでダイアログなしに公開状態も一緒に PUT する', async () => {
        adminFetch.mockResolvedValue(article)

        renderWithQueryClient(<ArticleEditView id={ARTICLE_ID} />)
        await screen.findByText('現金のみです。')

        await userEvent.click(screen.getByRole('switch', { name: '公開' }))
        expect(putCalls()).toHaveLength(0)

        await userEvent.click(screen.getByRole('button', { name: '保存' }))

        expect(await screen.findByText('保存しました')).toBeInTheDocument()
        expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument()
        expect(putBodies()).toEqual([{ title: '模擬店のお知らせ', content: article.content, status: 'published' }])
    })

    it('公開のスイッチを切り替えると「保存しました」を消す', async () => {
        adminFetch.mockResolvedValue(article)

        renderWithQueryClient(<ArticleEditView id={ARTICLE_ID} />)
        await screen.findByText('現金のみです。')
        await userEvent.click(screen.getByRole('button', { name: '保存' }))
        await screen.findByText('保存しました')

        await userEvent.click(screen.getByRole('switch', { name: '公開' }))

        expect(screen.queryByText('保存しました')).not.toBeInTheDocument()
    })

    describe('公開中の記事の保存', () => {
        async function openDialog() {
            adminFetch.mockResolvedValue(publishedArticle)

            renderWithQueryClient(<ArticleEditView id={ARTICLE_ID} />)
            await screen.findByText('現金のみです。')
            await userEvent.click(screen.getByRole('button', { name: '保存' }))

            return screen.findByRole('alertdialog', { name: '公開中の記事です' })
        }

        it('スイッチがオンのまま保存すると、ダイアログを出し、まだ保存しない', async () => {
            const dialog = await openDialog()

            expect(
                within(dialog).getByText('一時保存すると、公開中の記事はそのままで変更だけを保存します。'),
            ).toBeInTheDocument()
            expect(putCalls()).toHaveLength(0)
        })

        it('「一時保存する」を選ぶと、公開状態を送らずに PUT する', async () => {
            const dialog = await openDialog()

            await userEvent.click(within(dialog).getByRole('button', { name: '一時保存する' }))

            expect(await screen.findByText('保存しました')).toBeInTheDocument()
            expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument()
            expect(putBodies()).toEqual([{ title: '模擬店のお知らせ', content: publishedArticle.content }])
        })

        it('「公開に反映する」を選ぶと、公開状態を published にして PUT する', async () => {
            const dialog = await openDialog()

            await userEvent.click(within(dialog).getByRole('button', { name: '公開に反映する' }))

            expect(await screen.findByText('保存しました')).toBeInTheDocument()
            expect(putBodies()).toEqual([
                { title: '模擬店のお知らせ', content: publishedArticle.content, status: 'published' },
            ])
        })

        it('「キャンセル」を選ぶと、保存せずにダイアログを閉じる', async () => {
            const dialog = await openDialog()

            await userEvent.click(within(dialog).getByRole('button', { name: 'キャンセル' }))

            expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument()
            expect(putCalls()).toHaveLength(0)
        })

        it('スイッチをオフにして保存すると、ダイアログを出さずに下書きに戻す PUT をする', async () => {
            adminFetch.mockResolvedValue(publishedArticle)

            renderWithQueryClient(<ArticleEditView id={ARTICLE_ID} />)
            await screen.findByText('現金のみです。')
            await userEvent.click(screen.getByRole('switch', { name: '公開' }))
            await userEvent.click(screen.getByRole('button', { name: '保存' }))

            expect(await screen.findByText('保存しました')).toBeInTheDocument()
            expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument()
            expect(putBodies()).toEqual([
                { title: '模擬店のお知らせ', content: publishedArticle.content, status: 'draft' },
            ])
        })
    })

    it('タイトルが100文字を超えるとエラーを出し、保存しない', async () => {
        adminFetch.mockResolvedValue(article)

        renderWithQueryClient(<ArticleEditView id={ARTICLE_ID} />)
        await screen.findByText('現金のみです。')
        const titleInput = screen.getByRole('textbox', { name: 'タイトル' })

        await userEvent.clear(titleInput)
        await userEvent.click(titleInput)
        await userEvent.paste('あ'.repeat(101))
        await userEvent.click(screen.getByRole('button', { name: '保存' }))

        expect(await screen.findByRole('alert')).toHaveTextContent('タイトルは100文字以内で入力してください')
        expect(putCalls()).toHaveLength(0)
    })

    it.each([
        [500, 'internal_error', 'サーバー内部エラーが発生しました'],
        [403, 'forbidden', 'この記事を更新する権限がありません'],
    ])('保存に失敗（%i）したらエラーメッセージを出す', async (status, code, message) => {
        adminFetch.mockImplementation(async (_path: string, _schema: unknown, options?: FetchOptions) => {
            if (options?.method === 'PUT') {
                throw new ApiError(status, code, message)
            }
            return article
        })

        renderWithQueryClient(<ArticleEditView id={ARTICLE_ID} />)
        await screen.findByText('現金のみです。')

        await userEvent.click(screen.getByRole('button', { name: '保存' }))

        expect(await screen.findByRole('alert')).toHaveTextContent(message)
    })

    describe('予約', () => {
        /** 下書きの記事の版1を、2099/09/20 09:00（日本時間）に公開する予約がある */
        const scheduledArticle: ArticleResponse = {
            ...article,
            schedule: {
                version: 1,
                publish_at: '2099-09-20T00:00:00+00:00',
                created_by: USER_ID,
                created_at: '2026-09-14T05:00:00+00:00',
                updated_at: '2026-09-14T05:00:00+00:00',
            },
        }

        /** 保存の結果。版2ができている */
        const savedArticle: ArticleResponse = {
            ...article,
            latest_history: {
                ...article.latest_history!,
                version: 2,
                updated_at: '2026-09-14T06:00:00.123456+00:00',
            },
        }

        const schedulePath = `${articlePath}/schedule`

        beforeEach(() => {
            // カレンダーは今月を出すので、現在時刻を予約の日付（2099/09/20）と同じ月に固定する
            vi.useFakeTimers({ toFake: ['Date'] })
            vi.setSystemTime(new Date('2099-09-15T00:00:00+09:00'))
        })

        afterEach(() => {
            vi.useRealTimers()
        })

        /** ダイアログのカレンダーで日付を選び、時刻を入れる（日付のラベルは react-day-picker の aria-label） */
        async function pickPublishAt(dialog: HTMLElement, dayLabel: RegExp, time: string) {
            await userEvent.click(within(dialog).getByLabelText('公開する日付'))
            // カレンダーは popover で本体の外に描画されるので、画面全体から探す
            await userEvent.click(await screen.findByRole('button', { name: dayLabel }))
            fireEvent.change(within(dialog).getByLabelText('公開する時刻'), { target: { value: time } })
        }

        async function openScheduleDialog(fixture: ArticleResponse = article) {
            adminFetch.mockResolvedValue(fixture)

            renderWithQueryClient(<ArticleEditView id={ARTICLE_ID} />)
            await screen.findByText('現金のみです。')
            await userEvent.click(screen.getByRole('button', { name: '予約' }))

            return screen.findByRole('alertdialog', { name: '予約投稿' })
        }

        it('予約があると、公開予定の日時（日本時間）と「予約を取り消す」を出す', async () => {
            adminFetch.mockResolvedValue(scheduledArticle)

            renderWithQueryClient(<ArticleEditView id={ARTICLE_ID} />)

            expect(await screen.findByText('2099/09/20 09:00 に公開予定')).toBeInTheDocument()
            expect(screen.getByRole('button', { name: '予約を取り消す' })).toBeInTheDocument()
            expect(screen.queryByText('予約した版のあとに保存した変更があります（予約には入りません）')).toBeNull()
        })

        it('予約が無ければ、公開予定と「予約を取り消す」を出さない', async () => {
            adminFetch.mockResolvedValue(article)

            renderWithQueryClient(<ArticleEditView id={ARTICLE_ID} />)
            await screen.findByText('現金のみです。')

            expect(screen.queryByText(/に公開予定/)).not.toBeInTheDocument()
            expect(screen.queryByRole('button', { name: '予約を取り消す' })).not.toBeInTheDocument()
        })

        it('最新の版が予約した版と違うと、予約のあとに保存した変更があると出す', async () => {
            adminFetch.mockResolvedValue({ ...savedArticle, schedule: scheduledArticle.schedule })

            renderWithQueryClient(<ArticleEditView id={ARTICLE_ID} />)

            expect(
                await screen.findByText('予約した版のあとに保存した変更があります（予約には入りません）'),
            ).toBeInTheDocument()
        })

        it('「予約を取り消す」で予約を DELETE し、「予約を取り消しました」と出す', async () => {
            adminFetch.mockImplementation(async (_path: string, _schema: unknown, options?: FetchOptions) =>
                options?.method === 'DELETE' ? article : scheduledArticle,
            )

            renderWithQueryClient(<ArticleEditView id={ARTICLE_ID} />)
            await userEvent.click(await screen.findByRole('button', { name: '予約を取り消す' }))

            expect(await screen.findByText('予約を取り消しました')).toBeInTheDocument()
            expect(adminFetch).toHaveBeenCalledWith(schedulePath, expect.anything(), {
                method: 'DELETE',
                authenticated: true,
            })
            expect(screen.queryByText(/に公開予定/)).not.toBeInTheDocument()
        })

        it('日付と時刻を選んで「予約する」と、公開状態を送らずに保存してから、保存した最新の版を予約する', async () => {
            adminFetch.mockImplementation(async (path: string, _schema: unknown, options?: FetchOptions) => {
                if (options?.method !== 'PUT') return article
                return path === schedulePath ? { ...savedArticle, schedule: scheduledArticle.schedule } : savedArticle
            })

            renderWithQueryClient(<ArticleEditView id={ARTICLE_ID} />)
            await screen.findByText('現金のみです。')
            // 公開のスイッチの状態は予約に使わない
            await userEvent.click(screen.getByRole('switch', { name: '公開' }))
            await userEvent.click(screen.getByRole('button', { name: '予約' }))
            const dialog = await screen.findByRole('alertdialog', { name: '予約投稿' })
            await pickPublishAt(dialog, /2099年9月20日/, '09:00')
            await userEvent.click(within(dialog).getByRole('button', { name: '予約する' }))

            expect(await screen.findByText('予約しました')).toBeInTheDocument()
            expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument()
            expect(putCalls().map(([path, , options]) => [path, (options as FetchOptions).body])).toEqual([
                [articlePath, { title: '模擬店のお知らせ', content: article.content }],
                [
                    schedulePath,
                    {
                        version: 2,
                        version_updated_at: '2026-09-14T06:00:00.123456+00:00',
                        publish_at: '2099-09-20T09:00:00+09:00',
                    },
                ],
            ])
        })

        it('日付・時刻が未入力なら、入力欄の下にエラーを出し、保存も予約もしない', async () => {
            const dialog = await openScheduleDialog()

            await userEvent.click(within(dialog).getByRole('button', { name: '予約する' }))

            expect(await within(dialog).findByRole('alert')).toHaveTextContent('現在より後の日時を指定してください')
            expect(within(dialog).getByLabelText('公開する日付')).toHaveTextContent('日付を選ぶ')
            expect(putCalls()).toHaveLength(0)
        })

        it('日時が現在以前なら、入力欄の下にエラーを出し、保存も予約もしない', async () => {
            const dialog = await openScheduleDialog()

            await pickPublishAt(dialog, /2099年9月10日/, '09:00')
            await userEvent.click(within(dialog).getByRole('button', { name: '予約する' }))

            expect(await within(dialog).findByRole('alert')).toHaveTextContent('現在より後の日時を指定してください')
            expect(putCalls()).toHaveLength(0)
        })

        it('カレンダーを日本語で出す（曜日は 日〜土、見出しは YYYY年M月）', async () => {
            const dialog = await openScheduleDialog()

            await userEvent.click(within(dialog).getByLabelText('公開する日付'))

            expect(await screen.findByText('2099年9月')).toBeInTheDocument()
            // 曜日の行は aria-hidden の thead に描画されるので、DOM から直接見る
            const calendar = document.querySelector('[data-slot="popover-content"]')
            expect(calendar?.querySelector('thead')?.textContent).toBe('日月火水木金土')
        })

        it('予約があれば、予約の日付・時刻（日本時間）を初期値にする', async () => {
            const dialog = await openScheduleDialog(scheduledArticle)

            expect(within(dialog).getByLabelText('公開する日付')).toHaveTextContent('2099/09/20')
            expect(within(dialog).getByLabelText('公開する時刻')).toHaveValue('09:00')
        })

        it('予約に失敗したら（409）、ダイアログの中にエラーメッセージを出す', async () => {
            const message = '予約しようとした版が、そのあとの保存で更新されています。もう一度予約してください'
            adminFetch.mockImplementation(async (path: string, _schema: unknown, options?: FetchOptions) => {
                if (options?.method !== 'PUT') return article
                if (path === schedulePath) throw new ApiError(409, 'conflict', message)
                return savedArticle
            })

            renderWithQueryClient(<ArticleEditView id={ARTICLE_ID} />)
            await screen.findByText('現金のみです。')
            await userEvent.click(screen.getByRole('button', { name: '予約' }))
            const dialog = await screen.findByRole('alertdialog', { name: '予約投稿' })
            await pickPublishAt(dialog, /2099年9月20日/, '09:00')
            await userEvent.click(within(dialog).getByRole('button', { name: '予約する' }))

            expect(await within(dialog).findByRole('alert')).toHaveTextContent(message)
            expect(screen.queryByText('予約しました')).not.toBeInTheDocument()
        })

        it('タイトルが100文字を超えていたら、ダイアログを閉じてタイトルのエラーを出し、予約しない', async () => {
            adminFetch.mockResolvedValue(article)

            renderWithQueryClient(<ArticleEditView id={ARTICLE_ID} />)
            await screen.findByText('現金のみです。')
            const titleInput = screen.getByRole('textbox', { name: 'タイトル' })
            await userEvent.clear(titleInput)
            await userEvent.click(titleInput)
            await userEvent.paste('あ'.repeat(101))
            await userEvent.click(screen.getByRole('button', { name: '予約' }))
            const dialog = await screen.findByRole('alertdialog', { name: '予約投稿' })
            await pickPublishAt(dialog, /2099年9月20日/, '09:00')
            await userEvent.click(within(dialog).getByRole('button', { name: '予約する' }))

            expect(await screen.findByRole('alert')).toHaveTextContent('タイトルは100文字以内で入力してください')
            expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument()
            expect(putCalls()).toHaveLength(0)
        })
    })
})
