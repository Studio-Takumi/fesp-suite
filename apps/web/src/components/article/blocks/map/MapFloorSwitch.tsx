import { cn } from '@fesp/ui'

type MapFloorSwitchProps = {
    /** 上の階から並べる */
    floors: string[]
    selectedFloor: string
    onSelect: (floor: string) => void
}

/** フロアのボタンを縦に並べる。選んでいるボタンだけ水色にする（地図の面は変えない） */
export function MapFloorSwitch({ floors, selectedFloor, onSelect }: MapFloorSwitchProps) {
    return (
        <div
            role='group'
            aria-label='フロア'
            className='flex w-11 flex-col divide-y divide-slate-200 overflow-hidden rounded-xl bg-white shadow-md'
        >
            {floors.map((floor) => {
                const isSelected = floor === selectedFloor
                return (
                    <button
                        key={floor}
                        type='button'
                        aria-pressed={isSelected}
                        onClick={() => onSelect(floor)}
                        className={cn(
                            'h-10 text-sm font-semibold',
                            isSelected ? 'bg-sky-500 text-white' : 'bg-white text-slate-700',
                        )}
                    >
                        {floor}
                    </button>
                )
            })}
        </div>
    )
}
