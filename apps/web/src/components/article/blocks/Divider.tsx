import type { BlockComponentProps } from '../block-registry'

/** 区切り線 */
export function Divider({ children }: BlockComponentProps) {
    return (
        <>
            <hr className='border-border' />
            {children}
        </>
    )
}
