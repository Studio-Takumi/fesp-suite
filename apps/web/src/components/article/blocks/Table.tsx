import type { BlockComponentProps } from '../block-registry'
import { InlineContent } from '../InlineContent'

/** 表。`headerRows` 行目まで・`headerCols` 列目までを見出しセルにする。列幅は反映しない */
export function Table({ block, children }: BlockComponentProps) {
    const { content } = block
    if (!content || Array.isArray(content)) return null

    const headerRows = content.headerRows ?? 0
    const headerCols = content.headerCols ?? 0

    return (
        <>
            <div className='overflow-x-auto'>
                <table className='border-collapse text-sm'>
                    <tbody>
                        {content.rows.map((row, rowIndex) => (
                            <tr key={rowIndex}>
                                {row.cells.map((cell, cellIndex) => {
                                    // 見出し行のセルは列の見出し、見出し列のセルは行の見出しとして読ませる
                                    const scope =
                                        rowIndex < headerRows ? 'col' : cellIndex < headerCols ? 'row' : undefined
                                    const Cell = scope ? 'th' : 'td'
                                    return (
                                        <Cell
                                            key={cellIndex}
                                            scope={scope}
                                            colSpan={cell.props.colspan}
                                            rowSpan={cell.props.rowspan}
                                            className='border border-border px-3 py-2 text-left align-top'
                                        >
                                            <InlineContent content={cell.content} />
                                        </Cell>
                                    )
                                })}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            {children}
        </>
    )
}
