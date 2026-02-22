'use client'

import type { CakeShape } from '@/types/cake'

interface Props {
  value: CakeShape
  onChange: (shape: CakeShape) => void
}

const SHAPES: { value: CakeShape; label: string; icon: string }[] = [
  { value: 'circle', label: '원형', icon: '⬤' },
  { value: 'square', label: '사각형', icon: '■' },
]

export default function CakeShapeSelector({ value, onChange }: Props) {
  return (
    <div className="flex gap-2">
      {SHAPES.map((shape) => (
        <button
          key={shape.value}
          onClick={() => onChange(shape.value)}
          className={`flex flex-col items-center gap-1 px-3 py-2 rounded-lg border-2 text-sm font-medium transition-colors ${
            value === shape.value
              ? 'border-violet-500 bg-violet-50 text-violet-700'
              : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
          }`}
        >
          <span className="text-lg leading-none">{shape.icon}</span>
          <span>{shape.label}</span>
        </button>
      ))}
    </div>
  )
}
