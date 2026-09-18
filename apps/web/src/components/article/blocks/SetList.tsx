import { useQuery } from '@tanstack/react-query'

import { cn } from '@fesp/ui'

import { artistColor } from '~/components/artist/artist-color'
import { QueryBoundary } from '~/components/QueryBoundary'
import { currentArtistQuery, setListQuery } from '~/lib/queries'

import type { BlockComponentProps } from '../block-registry'

/**
 * セットリスト（独自コンポーネント `setList`）。表示中の出演者のセットリストを、曲名と原曲のアーティストで並べる。
 * props は持たない。曲が1曲も無ければブロックごと出さない
 */
export function SetList({ children }: BlockComponentProps) {
    const setList = useQuery(setListQuery())
    const artist = useQuery(currentArtistQuery())

    return (
        <>
            <QueryBoundary
                isPending={setList.isPending || artist.isPending}
                error={setList.error ?? artist.error}
                data={setList.data && artist.data ? { songs: setList.data, artistId: artist.data.id } : undefined}
            >
                {({ songs, artistId }) => {
                    if (songs.length === 0) return null
                    const color = artistColor(artistId)

                    return (
                        <section aria-label='セットリスト' className='flex flex-col gap-3'>
                            <h2 className='text-base font-bold text-slate-900'>セットリスト</h2>
                            <ol className='flex flex-col'>
                                {songs.map((song, index) => (
                                    <li
                                        key={song.id}
                                        className='flex items-center gap-3 border-b border-slate-100 py-3 last:border-b-0'
                                    >
                                        <span
                                            className={cn(
                                                'font-en flex size-6 shrink-0 items-center justify-center rounded-full text-xs font-semibold',
                                                color.background,
                                                color.accentText,
                                            )}
                                        >
                                            {index + 1}
                                        </span>
                                        <span className='flex min-w-0 flex-col gap-1'>
                                            <span className='text-sm font-medium text-slate-900'>{song.title}</span>
                                            <span className='text-xs text-slate-400'>{song.artist}</span>
                                        </span>
                                    </li>
                                ))}
                            </ol>
                        </section>
                    )
                }}
            </QueryBoundary>
            {children}
        </>
    )
}
