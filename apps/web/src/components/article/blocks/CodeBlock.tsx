import type { BlockComponentProps } from '../block-registry'

/** コードブロック。色分けはしない */
export function CodeBlock({ block, children }: BlockComponentProps) {
    const code = Array.isArray(block.content)
        ? block.content.map((item) => (item.type === 'text' ? item.text : '')).join('')
        : ''

    return (
        <>
            <pre className='overflow-x-auto rounded-md bg-muted p-4 text-sm'>
                <code>{code}</code>
            </pre>
            {children}
        </>
    )
}
