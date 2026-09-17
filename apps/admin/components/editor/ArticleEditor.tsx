'use client'

import { useCallback } from 'react'

import {
    BlockNoteSchema,
    defaultBlockSpecs,
    filterSuggestionItems,
    insertOrUpdateBlockForSlashMenu,
    SyntaxHighlightingExtension,
} from '@blocknote/core'
import { ja } from '@blocknote/core/locales'
import {
    BlockNoteViewRaw,
    ComponentsContext,
    getDefaultReactSlashMenuItems,
    SuggestionMenuController,
    useCreateBlockNote,
    useEditorState,
} from '@blocknote/react'
import { components as shadcnComponents, ShadCNComponentsContext, ShadCNDefaultComponents } from '@blocknote/shadcn'
import '@blocknote/shadcn/style.css'
import { CalendarDays, FileText, PanelTop, RefreshCw, Sun, Thermometer, TriangleAlert } from 'lucide-react'
import { createHighlighter } from 'shiki'

import type { ArticleDocument } from '@fesp/schema'

import { createPageHeaderBlock } from './blocks/PageHeaderBlock'
import { createTodayWeatherBlock } from './blocks/TodayWeatherBlock'
import { createWbgtBlock } from './blocks/WbgtBlock'
import { createWeatherAlertBlock } from './blocks/WeatherAlertBlock'
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
        // 独自コンポーネント。中身を持たず、props はサイドパネル（ComponentPropsPanel）で編集する
        pageHeader: createPageHeaderBlock(),
        todayWeather: createTodayWeatherBlock(),
        weeklyForecast: createWeeklyForecastBlock(),
        weatherAlert: createWeatherAlertBlock(),
        wbgt: createWbgtBlock(),
        weatherOverview: createWeatherOverviewBlock(),
        weatherCredit: createWeatherCreditBlock(),
    },
})

/** スラッシュメニューの「コンポーネント」グループに出す、独自コンポーネントのブロック */
const componentSlashMenuItems = [
    {
        type: 'pageHeader',
        title: 'ページ見出し',
        subtext: '英語ラベルと日本語タイトルの見出し',
        aliases: ['pageheader', 'midashi', 'みだし'],
        icon: <PanelTop />,
    },
    {
        type: 'todayWeather',
        title: '今日の天気',
        subtext: '今日の天気と気温',
        aliases: ['todayweather', 'weather', 'tenki', 'てんき'],
        icon: <Sun />,
    },
    {
        type: 'weeklyForecast',
        title: '週間予報',
        subtext: '1週間分の天気と気温',
        aliases: ['weeklyforecast', 'weather', 'tenki', 'てんき', 'yohou', 'よほう'],
        icon: <CalendarDays />,
    },
    {
        type: 'weatherAlert',
        title: '気象警報・注意報',
        subtext: '発表中の警報・注意報',
        aliases: ['weatheralert', 'weather', 'keihou', 'けいほう', 'tyuuihou', 'ちゅういほう'],
        icon: <TriangleAlert />,
    },
    {
        type: 'wbgt',
        title: '暑さ指数',
        subtext: '暑さ指数（WBGT）と段階',
        aliases: ['wbgt', 'weather', 'atusa', 'あつさ', 'nettyuusyou', 'ねっちゅうしょう'],
        icon: <Thermometer />,
    },
    {
        type: 'weatherOverview',
        title: '天気概況',
        subtext: '気象台の天気概況の文章',
        aliases: ['weatheroverview', 'weather', 'tenki', 'てんき', 'gaikyou', 'がいきょう'],
        icon: <FileText />,
    },
    {
        type: 'weatherCredit',
        title: '天気の更新時刻・出典',
        subtext: '天気の更新時刻と出典（気象庁）',
        aliases: ['weathercredit', 'weather', 'tenki', 'てんき', 'syutten', 'しゅってん'],
        icon: <RefreshCw />,
    },
] as const

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
            return filterSuggestionItems(
                [
                    ...items.filter((item) => (item as { key?: string }).key !== 'code_block'),
                    ...componentSlashMenuItems.map(({ type, aliases, ...item }) => ({
                        ...item,
                        aliases: [...aliases],
                        group: 'コンポーネント',
                        onItemClick: () => {
                            // 中身の無いブロックを入れるとカーソルが次のブロックに移るので、サイドパネルを開くために戻す
                            const block = insertOrUpdateBlockForSlashMenu(editor, { type })
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
            // `type` と `props` を分けて取り出すと組み合わせの型が消えるので、ComponentBlock に戻す
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
