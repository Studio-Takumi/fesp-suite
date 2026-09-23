'use client'

import { type ReactElement, useCallback } from 'react'

import {
    BlockNoteSchema,
    defaultBlockSpecs,
    filterSuggestionItems,
    insertOrUpdateBlockForSlashMenu,
    type PartialBlock,
    SyntaxHighlightingExtension,
} from '@blocknote/core'
import { ja } from '@blocknote/core/locales'
import {
    BlockNoteViewRaw,
    ComponentsContext,
    type DefaultReactSuggestionItem,
    getDefaultReactSlashMenuItems,
    SuggestionMenuController,
    useCreateBlockNote,
    useEditorState,
} from '@blocknote/react'
import { components as shadcnComponents, ShadCNComponentsContext, ShadCNDefaultComponents } from '@blocknote/shadcn'
import '@blocknote/shadcn/style.css'
import {
    ArrowLeftRight,
    BookOpen,
    CalendarClock,
    CalendarDays,
    CloudSun,
    Files,
    FileText,
    ImageIcon,
    Images,
    Info,
    LayoutGrid,
    ListMusic,
    MapIcon,
    Mic,
    MousePointerClick,
    Music,
    Newspaper,
    PanelTop,
    RefreshCw,
    ShoppingBag,
    Store,
    Sun,
    Thermometer,
    TriangleAlert,
    UserRound,
} from 'lucide-react'
import { createHighlighter } from 'shiki'

import type { ArticleDocument } from '@fesp/schema'

import { createAdjacentPostsBlock } from './blocks/AdjacentPostsBlock'
import { createArtistActionsBlock } from './blocks/ArtistActionsBlock'
import { createArtistListBlock } from './blocks/ArtistListBlock'
import { createArtistSummaryBlock } from './blocks/ArtistSummaryBlock'
import { createBlogListBlock } from './blocks/BlogListBlock'
import { createCalloutBlock } from './blocks/CalloutBlock'
import { createContentListBlock } from './blocks/ContentListBlock'
import { createCoverImageBlock } from './blocks/CoverImageBlock'
import { createMainHeroBlock } from './blocks/MainHeroBlock'
import { createMapBlock } from './blocks/MapBlock'
import { createNewsListBlock } from './blocks/NewsListBlock'
import { createPageHeaderBlock } from './blocks/PageHeaderBlock'
import { createPostSummaryBlock } from './blocks/PostSummaryBlock'
import { createProductListBlock } from './blocks/ProductListBlock'
import { createRelatedPostsBlock } from './blocks/RelatedPostsBlock'
import { createScheduleTableBlock } from './blocks/ScheduleTableBlock'
import { createSetListBlock } from './blocks/SetListBlock'
import { createShopActionsBlock } from './blocks/ShopActionsBlock'
import { createShopListBlock } from './blocks/ShopListBlock'
import { createShopSummaryBlock } from './blocks/ShopSummaryBlock'
import { createTodayWeatherBlock } from './blocks/TodayWeatherBlock'
import { createWbgtBlock } from './blocks/WbgtBlock'
import { createWeatherAlertBlock } from './blocks/WeatherAlertBlock'
import { createWeatherBarBlock } from './blocks/WeatherBarBlock'
import { createWeatherCreditBlock } from './blocks/WeatherCreditBlock'
import { createWeatherOverviewBlock } from './blocks/WeatherOverviewBlock'
import { createWeeklyForecastBlock } from './blocks/WeeklyForecastBlock'
import { type ComponentBlock, ComponentPropsPanel, isComponentBlock } from './ComponentPropsPanel'
import { EmojiGridRoot } from './EmojiGridRoot'
import { SlashMenuItem } from './SlashMenuItem'
import { SlashMenuRoot } from './SlashMenuRoot'

/**
 * スラッシュメニュー・絵文字ピッカーの見た目をNotionに寄せる。スラッシュメニューは項目の
 * 説明を常時表示せずホバーのツールチップにし（SlashMenuItem）、どちらも外枠を一定の高さで
 * スクロールさせる（SlashMenuRoot / EmojiGridRoot）。
 */
const editorComponents = {
    ...shadcnComponents,
    SuggestionMenu: { ...shadcnComponents.SuggestionMenu, Root: SlashMenuRoot, Item: SlashMenuItem },
    GridSuggestionMenu: { ...shadcnComponents.GridSuggestionMenu, Root: EmojiGridRoot },
}

/**
 * VSCodeのようなシンタックスハイライト（Shiki）。対応言語はこの7つに絞る。
 * コードブロックの背景がBlockNote標準でダーク固定のため、テーマもダーク系にする
 * （ライト系テーマだと一部の文字色が背景に対して読みにくくなるため）
 */
const syntaxHighlighting = SyntaxHighlightingExtension({
    createHighlighter: () =>
        createHighlighter({
            themes: ['github-dark'],
            langs: ['html', 'css', 'javascript', 'typescript', 'json', 'yaml', 'markdown'],
        }),
})

export const articleSchema = BlockNoteSchema.create({
    blockSpecs: {
        paragraph: defaultBlockSpecs.paragraph,
        heading: defaultBlockSpecs.heading,
        bulletListItem: defaultBlockSpecs.bulletListItem,
        numberedListItem: defaultBlockSpecs.numberedListItem,
        checkListItem: defaultBlockSpecs.checkListItem,
        toggleListItem: defaultBlockSpecs.toggleListItem,
        quote: defaultBlockSpecs.quote,
        divider: defaultBlockSpecs.divider,
        table: defaultBlockSpecs.table,
        // 裏機能。バッククォート3つ（```）で誰でも作れるが、スラッシュメニューには出さない
        codeBlock: defaultBlockSpecs.codeBlock,
        callout: createCalloutBlock(),
        // 独自コンポーネント。中身を持たず、props はサイドパネル（ComponentPropsPanel）で編集する
        pageHeader: createPageHeaderBlock(),
        scheduleTable: createScheduleTableBlock(),
        map: createMapBlock(),
        shopList: createShopListBlock(),
        shopSummary: createShopSummaryBlock(),
        productList: createProductListBlock(),
        shopActions: createShopActionsBlock(),
        artistList: createArtistListBlock(),
        artistSummary: createArtistSummaryBlock(),
        setList: createSetListBlock(),
        artistActions: createArtistActionsBlock(),
        mainHero: createMainHeroBlock(),
        weatherBar: createWeatherBarBlock(),
        contentList: createContentListBlock(),
        newsList: createNewsListBlock(),
        coverImage: createCoverImageBlock(),
        postSummary: createPostSummaryBlock(),
        adjacentPosts: createAdjacentPostsBlock(),
        blogList: createBlogListBlock(),
        relatedPosts: createRelatedPostsBlock(),
        todayWeather: createTodayWeatherBlock(),
        weeklyForecast: createWeeklyForecastBlock(),
        weatherAlert: createWeatherAlertBlock(),
        wbgt: createWbgtBlock(),
        weatherOverview: createWeatherOverviewBlock(),
        weatherCredit: createWeatherCreditBlock(),
    },
})

/** BlockNote に元からある項目と同じアイコンの大きさ（`@blocknote/react` の既定） */
const SLASH_MENU_ICON_SIZE = 18

/**
 * スラッシュメニューに出す独自コンポーネント。ページごとのグループに分け、この配列の順に出す。
 * グループの順番は最初に出てきた順で決まるので、並べ替えるときはこの配列を並べ替える
 */
export const componentSlashMenuItems: {
    type: ComponentBlock['type']
    group: string
    title: string
    subtext: string
    aliases: string[]
    icon: ReactElement
}[] = [
    {
        type: 'pageHeader',
        group: '共通',
        title: 'ページ見出し',
        subtext: '英語ラベルと日本語タイトルの見出し',
        aliases: ['pageheader', 'midashi', 'みだし'],
        icon: <PanelTop size={SLASH_MENU_ICON_SIZE} />,
    },
    {
        type: 'mainHero',
        group: 'Home',
        title: 'メインスライダー',
        subtext: '画像・キャッチ・タイトルのスライダー',
        aliases: ['mainhero', 'hero', 'slider', 'suraida', 'スライダー'],
        icon: <Images size={SLASH_MENU_ICON_SIZE} />,
    },
    {
        type: 'weatherBar',
        group: 'Home',
        title: '日付・天気の帯',
        subtext: '今日の日付と天気（押すと天気ページへ）',
        aliases: ['weatherbar', 'weather', 'tenki', 'てんき', 'hiduke', 'ひづけ'],
        icon: <CloudSun size={SLASH_MENU_ICON_SIZE} />,
    },
    {
        type: 'contentList',
        group: 'Home',
        title: 'その他のコンテンツ',
        subtext: '各ページへのリンクのグリッド',
        aliases: ['contentlist', 'link', 'rinku', 'リンク', 'kontentsu', 'コンテンツ'],
        icon: <LayoutGrid size={SLASH_MENU_ICON_SIZE} />,
    },
    {
        type: 'newsList',
        group: 'News',
        title: 'お知らせ一覧',
        subtext: 'タグで絞り込めるお知らせの一覧',
        aliases: ['newslist', 'news', 'oshirase', 'おしらせ'],
        icon: <Newspaper size={SLASH_MENU_ICON_SIZE} />,
    },
    {
        type: 'coverImage',
        group: 'News',
        title: '記事の画像',
        subtext: '記事の先頭に出す画像',
        aliases: ['coverimage', 'image', 'gazou', 'がぞう'],
        icon: <ImageIcon size={SLASH_MENU_ICON_SIZE} />,
    },
    {
        type: 'postSummary',
        group: 'News',
        title: '記事のサマリー',
        subtext: '表示中の記事の作成者・日時・ハッシュタグ',
        aliases: ['postsummary', 'summary', 'sama', 'さまりー'],
        icon: <UserRound size={SLASH_MENU_ICON_SIZE} />,
    },
    {
        type: 'adjacentPosts',
        group: 'News',
        title: '前後の記事',
        subtext: '前の記事・次の記事へのリンク',
        aliases: ['adjacentposts', 'zengo', 'ぜんご'],
        icon: <ArrowLeftRight size={SLASH_MENU_ICON_SIZE} />,
    },
    {
        type: 'blogList',
        group: 'Blog',
        title: 'ブログ一覧',
        subtext: 'タグで絞り込めるブログの一覧',
        aliases: ['bloglist', 'blog', 'burogu', 'ぶろぐ'],
        icon: <BookOpen size={SLASH_MENU_ICON_SIZE} />,
    },
    {
        type: 'relatedPosts',
        group: 'Blog',
        title: '関連する記事',
        subtext: '表示中の記事に関連する記事のリスト',
        aliases: ['relatedposts', 'related', 'kanren', 'かんれん'],
        icon: <Files size={SLASH_MENU_ICON_SIZE} />,
    },
    {
        type: 'scheduleTable',
        group: 'Schedule',
        title: 'スケジュール表',
        subtext: '日付タブと会場ごとのタイムテーブル',
        aliases: ['scheduletable', 'schedule', 'timetable', 'sukejuru', 'スケジュール', 'タイムテーブル'],
        icon: <CalendarClock size={SLASH_MENU_ICON_SIZE} />,
    },
    {
        type: 'map',
        group: 'Map',
        title: 'マップ',
        subtext: '会場のマップ（検索・フロア切替・場所の一覧）',
        aliases: ['map', 'chizu', 'ちず', '地図'],
        icon: <MapIcon size={SLASH_MENU_ICON_SIZE} />,
    },
    {
        type: 'todayWeather',
        group: 'Weather',
        title: '今日の天気',
        subtext: '今日の天気と気温',
        aliases: ['todayweather', 'weather', 'tenki', 'てんき'],
        icon: <Sun size={SLASH_MENU_ICON_SIZE} />,
    },
    {
        type: 'weeklyForecast',
        group: 'Weather',
        title: '週間予報',
        subtext: '1週間分の天気と気温',
        aliases: ['weeklyforecast', 'weather', 'tenki', 'てんき', 'yohou', 'よほう'],
        icon: <CalendarDays size={SLASH_MENU_ICON_SIZE} />,
    },
    {
        type: 'weatherAlert',
        group: 'Weather',
        title: '気象警報・注意報',
        subtext: '発表中の警報・注意報',
        aliases: ['weatheralert', 'weather', 'keihou', 'けいほう', 'tyuuihou', 'ちゅういほう'],
        icon: <TriangleAlert size={SLASH_MENU_ICON_SIZE} />,
    },
    {
        type: 'wbgt',
        group: 'Weather',
        title: '暑さ指数',
        subtext: '暑さ指数（WBGT）と段階',
        aliases: ['wbgt', 'weather', 'atusa', 'あつさ', 'nettyuusyou', 'ねっちゅうしょう'],
        icon: <Thermometer size={SLASH_MENU_ICON_SIZE} />,
    },
    {
        type: 'weatherOverview',
        group: 'Weather',
        title: '天気概況',
        subtext: '気象台の天気概況の文章',
        aliases: ['weatheroverview', 'weather', 'tenki', 'てんき', 'gaikyou', 'がいきょう'],
        icon: <FileText size={SLASH_MENU_ICON_SIZE} />,
    },
    {
        type: 'weatherCredit',
        group: 'Weather',
        title: '天気の更新時刻・出典',
        subtext: '天気の更新時刻と出典（気象庁）',
        aliases: ['weathercredit', 'weather', 'tenki', 'てんき', 'syutten', 'しゅってん'],
        icon: <RefreshCw size={SLASH_MENU_ICON_SIZE} />,
    },
    {
        type: 'shopList',
        group: 'Shop',
        title: '模擬店一覧',
        subtext: '日付・検索・タグで絞り込める模擬店の一覧',
        aliases: ['shoplist', 'shop', 'mogiten', 'もぎてん', '模擬店'],
        icon: <Store size={SLASH_MENU_ICON_SIZE} />,
    },
    {
        type: 'shopSummary',
        group: 'Shop',
        title: '模擬店のサマリー',
        subtext: '表示中の模擬店の Day・団体・店名・時間・場所',
        aliases: ['shopsummary', 'shop', 'mogiten', 'もぎてん', 'sama', 'さまりー'],
        icon: <Info size={SLASH_MENU_ICON_SIZE} />,
    },
    {
        type: 'productList',
        group: 'Shop',
        title: '商品一覧',
        subtext: '表示中の模擬店の商品（メニュー）の一覧',
        aliases: ['productlist', 'product', 'menu', 'syouhin', 'しょうひん', 'めにゅー'],
        icon: <ShoppingBag size={SLASH_MENU_ICON_SIZE} />,
    },
    {
        type: 'shopActions',
        group: 'Shop',
        title: '模擬店のアクション',
        subtext: 'マップへ移動するボタン',
        aliases: ['shopactions', 'action', 'button', 'akusyon', 'アクション', 'ぼたん'],
        icon: <MousePointerClick size={SLASH_MENU_ICON_SIZE} />,
    },
    {
        type: 'artistList',
        group: 'Artist',
        title: '出演者一覧',
        subtext: '日付・検索・タグで絞り込める出演者の一覧',
        aliases: ['artistlist', 'artist', 'syutuensya', 'しゅつえんしゃ', '出演者'],
        icon: <Music size={SLASH_MENU_ICON_SIZE} />,
    },
    {
        type: 'artistSummary',
        group: 'Artist',
        title: '出演者のサマリー',
        subtext: '表示中の出演者の Day・団体・演目・出演日時・会場・人数',
        aliases: ['artistsummary', 'artist', 'summary', 'しゅつえんしゃ', '出演者'],
        icon: <Mic size={SLASH_MENU_ICON_SIZE} />,
    },
    {
        type: 'setList',
        group: 'Artist',
        title: 'セットリスト',
        subtext: '表示中の出演者のセットリスト',
        aliases: ['setlist', 'setto', 'セトリ', 'せっとりすと'],
        icon: <ListMusic size={SLASH_MENU_ICON_SIZE} />,
    },
    {
        type: 'artistActions',
        group: 'Artist',
        title: '出演者のアクション',
        subtext: 'スケジュール・マップへ移動するボタン',
        aliases: ['artistactions', 'action', 'button', 'akusyon', 'アクション', 'ぼたん'],
        icon: <MousePointerClick size={SLASH_MENU_ICON_SIZE} />,
    },
]

export type ArticleEditorProps = {
    content?: ArticleDocument
    onChange?: (document: ArticleDocument) => void
}

/**
 * 記事本文の編集（テキスト・見出し・リスト・チェックリスト・トグルリスト・引用・区切り線・表）。
 * BlockNote（Notionライクなブロックエディタ）ベース。
 *
 * ツールバーはBlockNote標準のもの（テキスト選択時のフローティングツールバー・
 * `/` のスラッシュメニュー）をそのまま使う。コードブロックは``` で作れる裏機能として
 * スキーマ上は許可するが、スラッシュメニューには出さない（getSlashMenuItems参照）。
 * コードブロックの中身はShiki（VSCode等と同じハイライトエンジン）で色分けする。
 * 対応言語はhtml/css/javascript/typescript/json/yaml/markdownの7つに絞っている
 * （バンドルサイズの都合。増やす場合はsyntaxHighlightingのlangsに足す）。
 * 独自コンポーネントのブロックはスラッシュメニューの「コンポーネント」グループから挿入し、
 * カーソルがある間だけ右のサイドパネル（ComponentPropsPanel）で props を編集する。
 * テンプレートによるロックは #64 で対応する。
 * 共同編集（Yjs）はこの版では繋がない（同期編集は `CollaborativeEditor.tsx` の役割）。
 */
export function ArticleEditor({ content, onChange }: ArticleEditorProps) {
    const editor = useCreateBlockNote({
        schema: articleSchema,
        dictionary: ja,
        extensions: [syntaxHighlighting],
        initialContent: content && content.length > 0 ? content : undefined,
    })

    // コードブロックは裏機能（```で作れる）なのでスラッシュメニューには出さない。
    // `key` はロケールに依存しない識別子（BlockNoteのi18n辞書のキー名）。
    // `DefaultReactSuggestionItem` の型定義は`key`を持たないが、実体には残っている
    const getSlashMenuItems = useCallback(
        async (query: string) => {
            const items = await getDefaultReactSlashMenuItems(editor)
            const calloutItem = {
                title: '注意書き',
                subtext: '読み飛ばされたくない文章を色付きの枠で囲む',
                aliases: ['callout', 'chuui', 'ちゅうい', '注意'],
                group: items.find((item) => (item as { key?: string }).key === 'quote')?.group ?? '基本ブロック',
                icon: <TriangleAlert size={SLASH_MENU_ICON_SIZE} />,
                onItemClick: () => insertOrUpdateBlockForSlashMenu(editor, { type: 'callout' }),
            }
            return filterSuggestionItems(
                [
                    ...items
                        .filter((item) => (item as { key?: string }).key !== 'code_block')
                        .flatMap((item) => ((item as { key?: string }).key === 'quote' ? [item, calloutItem] : [item])),
                    ...componentSlashMenuItems.map(({ type, ...item }): DefaultReactSuggestionItem => ({
                        ...item,
                        onItemClick: () => {
                            // 中身の無いブロックを入れるとカーソルが次のブロックに移るので、サイドパネルを開くために戻す。
                            // `{ type: 共用体 }` は、ブロックの種類が増えると TypeScript が PartialBlock の
                            // 共用体へ展開しきれなくなる（判別プロパティの組み合わせに上限がある）ので、ここで型を付ける
                            const block = insertOrUpdateBlockForSlashMenu(editor, {
                                type,
                            } as PartialBlock<typeof articleSchema.blockSchema>)
                            editor.setTextCursorPosition(block)
                        },
                    })),
                ],
                query,
            )
        },
        [editor],
    )

    // カーソルがある独自コンポーネントのブロック。無ければサイドパネルを出さない
    const activeComponentBlock = useEditorState({
        editor,
        selector: ({ editor }): ComponentBlock | null => {
            const { block } = editor.getTextCursorPosition()
            // BlockNote のブロックの型は type と props の対応を持たないので、ComponentBlock に合わせる
            return isComponentBlock(block)
                ? ({ id: block.id, type: block.type, props: block.props } as ComponentBlock)
                : null
        },
    })

    // フォームの購読を張り直さないよう、ブロックの props ではなく id が変わったときだけ作り直す
    const activeComponentBlockId = activeComponentBlock?.id
    const handleComponentPropsChange = useCallback(
        (props: ComponentBlock['props']) => {
            if (activeComponentBlockId) editor.updateBlock(activeComponentBlockId, { props })
        },
        [editor, activeComponentBlockId],
    )

    return (
        <div className='flex items-start gap-4'>
            <div className='min-w-0 flex-1 rounded-md border border-border'>
                <ShadCNComponentsContext.Provider value={ShadCNDefaultComponents}>
                    <ComponentsContext.Provider value={editorComponents}>
                        <BlockNoteViewRaw
                            editor={editor}
                            theme='light'
                            className='bn-shadcn'
                            aria-label='本文エディタ'
                            slashMenu={false}
                            onChange={() => onChange?.(editor.document as ArticleDocument)}
                        >
                            <SuggestionMenuController triggerCharacter='/' getItems={getSlashMenuItems} />
                        </BlockNoteViewRaw>
                    </ComponentsContext.Provider>
                </ShadCNComponentsContext.Provider>
            </div>
            {activeComponentBlock && (
                <ComponentPropsPanel block={activeComponentBlock} onChange={handleComponentPropsChange} />
            )}
        </div>
    )
}
