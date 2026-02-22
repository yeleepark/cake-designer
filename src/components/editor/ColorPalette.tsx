'use client'

interface Props {
  color: string
  size: number
  onColorChange: (color: string) => void
  onSizeChange: (size: number) => void
}

const PRESET_COLORS = [
  '#000000', '#ffffff', '#ef4444', '#f97316', '#eab308',
  '#22c55e', '#3b82f6', '#8b5cf6', '#ec4899', '#06b6d4',
  '#a16207', '#be185d', '#7c3aed', '#0f766e', '#1d4ed8',
  '#fbbf24', '#f9a8d4', '#a7f3d0', '#bfdbfe', '#ddd6fe',
]

export default function ColorPalette({ color, size, onColorChange, onSizeChange }: Props) {
  return (
    <div className="flex flex-col gap-3">
      <div>
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">색상</p>
        <div className="grid grid-cols-5 gap-1.5">
          {PRESET_COLORS.map((c) => (
            <button
              key={c}
              onClick={() => onColorChange(c)}
              className={`w-7 h-7 rounded-md border-2 transition-transform hover:scale-110 ${
                color === c ? 'border-violet-500 scale-110' : 'border-gray-200'
              }`}
              style={{ backgroundColor: c }}
              title={c}
            />
          ))}
        </div>
        <div className="mt-2 flex items-center gap-2">
          <label className="text-xs text-gray-500">직접 입력:</label>
          <input
            type="color"
            value={color}
            onChange={(e) => onColorChange(e.target.value)}
            className="w-8 h-8 rounded cursor-pointer border border-gray-200"
          />
          <span className="text-xs font-mono text-gray-600">{color}</span>
        </div>
      </div>

      <div>
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
          굵기: {size}px
        </p>
        <input
          type="range"
          min={1}
          max={60}
          value={size}
          onChange={(e) => onSizeChange(Number(e.target.value))}
          className="w-full accent-violet-500"
        />
        <div className="flex justify-between text-xs text-gray-400 mt-1">
          <span>1</span>
          <span>60</span>
        </div>
      </div>
    </div>
  )
}
