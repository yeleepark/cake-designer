'use client'

import type { CakeShape } from '@/types/cake'
import CircleIcon from '@mui/icons-material/Circle'
import CropSquareIcon from '@mui/icons-material/CropSquare'

interface Props {
  value: CakeShape
  onChange: (shape: CakeShape) => void
  compact?: boolean
}

const SHAPES: { value: CakeShape; label: string; icon: React.ReactNode }[] = [
  { value: 'circle', label: '원형', icon: <CircleIcon sx={{ fontSize: 20 }} /> },
  { value: 'square', label: '사각형', icon: <CropSquareIcon sx={{ fontSize: 20 }} /> },
]

export default function CakeShapeSelector({ value, onChange, compact = false }: Props) {
  return (
    <div className="flex gap-2">
      {SHAPES.map((shape) => (
        <button
          key={shape.value}
          onClick={() => onChange(shape.value)}
          title={shape.label}
          className={`flex items-center justify-center rounded-xl border-2 font-medium transition-colors ${
            compact
              ? 'w-12 h-12'
              : 'flex-col gap-1 px-3 py-2 text-sm'
          } ${
            value === shape.value
              ? 'border-violet-500 bg-violet-50 text-violet-700'
              : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
          }`}
        >
          {shape.icon}
          {!compact && <span>{shape.label}</span>}
        </button>
      ))}
    </div>
  )
}
