import { useQuery } from '@tanstack/react-query'

import { Card, CardContent, CardHeader, CardTitle } from '@fesp/ui'

import { QueryBoundary } from '~/components/QueryBoundary'
import { exampleQuery } from '~/lib/queries'
import { useUiStore } from '~/stores/ui'

/**
 * 配線確認用のページ。
 * TanStack Query（サーバー状態）と Zustand（UI状態）が繋がっていることを確認できる。
 * 画面を作り始めるときは、このファイルを置き換えて `src/pages/` に足していく。
 */
export function HomePage() {
    const example = useQuery(exampleQuery())
    const { isMenuOpen, toggleMenu } = useUiStore()

    return (
        <div className='space-y-6'>
            <h1 className='text-2xl font-bold'>セットアップ完了</h1>

            <Card>
                <CardHeader>
                    <CardTitle>API との疎通</CardTitle>
                </CardHeader>
                <CardContent>
                    <QueryBoundary isPending={example.isPending} error={example.error} data={example.data}>
                        {(data) => (
                            <p>
                                {data.message}
                                <br />
                                <span className='text-sm text-muted-foreground'>{data.now}</span>
                            </p>
                        )}
                    </QueryBoundary>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>クライアントUI状態（Zustand）</CardTitle>
                </CardHeader>
                <CardContent className='space-y-2'>
                    <button
                        type='button'
                        onClick={toggleMenu}
                        className='h-9 rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground'
                    >
                        切り替える
                    </button>
                    <p className='text-sm text-muted-foreground'>isMenuOpen: {String(isMenuOpen)}</p>
                </CardContent>
            </Card>
        </div>
    )
}
