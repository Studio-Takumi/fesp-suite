import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import { describe, expect, it } from 'vitest'

import { setTabletWidth } from '~/test/media'
import { slugArticleFixture } from '~/test/msw/handlers'
import { server } from '~/test/msw/server'
import { renderApp } from '~/test/render'

const API = 'http://localhost:8787'

/** 仮の個別ページ（`NewsPostPage`）にしかない文 */
const detailText = '2日目のステージは、雨天のため体育館に会場を変更します。'

/** 一覧側の記事に、お知らせ一覧のブロックを足して返す（既定のフィクスチャはページ見出しだけ） */
function serveNewsListArticle() {
    server.use(
        http.get(`${API}/api/articles/slug/:slug`, ({ params }) => {
            const article = slugArticleFixture(String(params.slug))
            return HttpResponse.json({
                ...article,
                content: [
                    ...article.content,
                    {
                        id: '2',
                        type: 'newsList',
                        props: { showTagTabs: false, tags: '', showViewAll: false },
                        children: [],
                    },
                ],
            })
        }),
    )
}

/** 左のペインの一覧の中の行。個別のペインにも同じ行き先のリンク（前後の記事）があるので、一覧の中から探す */
const listRow = (id: string) =>
    within(screen.getByRole('region', { name: 'お知らせ' }))
        .getAllByRole('link')
        .find((link) => link.getAttribute('href') === `/news/${id}`)

describe('一覧と個別の2ペイン', () => {
    it('幅が足りないときは、一覧のパスで一覧だけを出す', async () => {
        renderApp('/news')

        expect(await screen.findByRole('heading', { level: 1, name: 'news' })).toBeInTheDocument()
        expect(screen.queryByText(detailText)).not.toBeInTheDocument()
    })

    it('幅が足りないときは、個別のパスで個別だけを出す', async () => {
        renderApp('/news/news-8')

        expect(await screen.findByText(detailText)).toBeInTheDocument()
        expect(screen.queryByRole('heading', { level: 1, name: 'news' })).not.toBeInTheDocument()
    })

    it('幅が足りていれば、一覧のパスで右のペインに先頭の記事を出す', async () => {
        setTabletWidth(true)

        renderApp('/news')

        expect(await screen.findByRole('heading', { level: 1, name: 'news' })).toBeInTheDocument()
        expect(screen.getByText(detailText)).toBeInTheDocument()
    })

    it('幅が足りていれば、個別のパスで一覧と個別を並べて出す', async () => {
        setTabletWidth(true)
        serveNewsListArticle()

        renderApp('/news/news-8')

        expect(await screen.findByRole('heading', { level: 1, name: 'news' })).toBeInTheDocument()
        expect(screen.getByText(detailText)).toBeInTheDocument()
    })

    it('右のペインに出している記事は、一覧の行に選択中の背景を付ける', async () => {
        setTabletWidth(true)
        serveNewsListArticle()

        renderApp('/news/news-8')

        await waitFor(() => expect(listRow('news-8')).toBeDefined())
        expect(listRow('news-8')).toHaveClass('bg-sky-50')
        // 開いていない行には付けない
        expect(listRow('news-7')).not.toHaveClass('bg-sky-50')
    })

    it('一覧の行を押すと、ページを読み直さずに個別のパスへ移動する', async () => {
        setTabletWidth(true)
        serveNewsListArticle()

        const { router } = renderApp('/news')

        await waitFor(() => expect(listRow('news-8')).toBeDefined())
        await userEvent.click(listRow('news-8')!)

        await waitFor(() => expect(router.state.location.pathname).toBe('/news/news-8'))
        expect(screen.getByRole('heading', { level: 1, name: 'news' })).toBeInTheDocument()
    })
})
