'use client'

import { useState, useRef, useEffect } from 'react'
import BrushIcon from '@mui/icons-material/Brush'
import AutoFixNormalIcon from '@mui/icons-material/AutoFixNormal'
import FormatColorFillIcon from '@mui/icons-material/FormatColorFill'
import FormatPaintIcon from '@mui/icons-material/FormatPaint'
import UndoIcon from '@mui/icons-material/Undo'
import type { Tool } from '@/types/cake'

interface Props {
  value: Tool
  onChange: (tool: Tool) => void
  color: string
  onColorChange: (color: string) => void
  size: number
  onSizeChange: (size: number) => void
  baseColor: string
  onBaseColorChange: (color: string) => void
  onUndo?: () => void
  canUndo?: boolean
}

const PRESET_COLORS = [
  '#F8C8DC', '#FFAEBE', '#EDACB1', '#FFF3E8', '#C97A8D',
  '#FF6B81', '#FF9AA2', '#FFD3B6', '#FFF5F0', '#C44569',
  '#A3B18A', '#588157', '#DAD7CD', '#FFF1E6', '#6B705C',
  '#A0C4FF', '#BDB2FF', '#FFC6FF', '#FDFFB6', '#6C63FF',
]

const TOOLS: { value: Tool; icon: React.ReactNode; title: string }[] = [
  { value: 'brush', icon: <BrushIcon fontSize="small" />, title: '브러쉬' },
  { value: 'eraser', icon: <AutoFixNormalIcon fontSize="small" />, title: '지우개' },
  { value: 'fill', icon: <FormatColorFillIcon fontSize="small" />, title: '채우기' },
]

export default function Toolbar({ value, onChange, color, onColorChange, size, onSizeChange, baseColor, onBaseColorChange, onUndo, canUndo }: Props) {
  const [popupOpen, setPopupOpen] = useState(false)
  const [baseColorPopupOpen, setBaseColorPopupOpen] = useState(false)
  const popupRef = useRef<HTMLDivElement>(null)
  const anchorRef = useRef<HTMLButtonElement>(null)
  const baseColorAnchorRef = useRef<HTMLButtonElement>(null)
  const baseColorPopupRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (
        popupRef.current && !popupRef.current.contains(e.target as Node) &&
        anchorRef.current && !anchorRef.current.contains(e.target as Node)
      ) {
        setPopupOpen(false)
      }
      if (
        baseColorPopupRef.current && !baseColorPopupRef.current.contains(e.target as Node) &&
        baseColorAnchorRef.current && !baseColorAnchorRef.current.contains(e.target as Node)
      ) {
        setBaseColorPopupOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const handleToolClick = (tool: Tool) => {
    if ((tool === 'brush' || tool === 'eraser') && value === tool) {
      setPopupOpen((o) => !o)
    } else {
      onChange(tool)
      setPopupOpen(tool === 'brush' || tool === 'eraser')
    }
  }

  const showPopup = popupOpen && (value === 'brush' || value === 'eraser')

  return (
    <div className="relative flex flex-col gap-1">
      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">도구</p>

      {TOOLS.map((tool) => {
        const isActive = value === tool.value
        const isAnchor = isActive && (tool.value === 'brush' || tool.value === 'eraser')

        return (
          <button
            key={tool.value}
            ref={isAnchor ? anchorRef : undefined}
            title={tool.title}
            onClick={() => handleToolClick(tool.value)}
            className={`relative flex items-center justify-center w-10 h-10 rounded-xl border transition-colors ${
              isActive
                ? 'border-violet-500 bg-violet-100 text-violet-700'
                : 'border-transparent bg-white text-gray-500 hover:bg-gray-100 hover:text-gray-700'
            }`}
          >
            {tool.icon}
            {/* 브러쉬 선택 색상 점 */}
            {tool.value === 'brush' && (
              <span
                className="absolute bottom-1 right-1 w-2 h-2 rounded-full border border-white"
                style={{ backgroundColor: color }}
              />
            )}
          </button>
        )
      })}

      {/* 구분선 + 바탕색 */}
      <div className="my-2 border-t border-gray-200" />
      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">바탕</p>
      <button
        ref={baseColorAnchorRef}
        title="바탕 색상"
        onClick={() => setBaseColorPopupOpen((o) => !o)}
        className={`relative flex items-center justify-center w-10 h-10 rounded-xl border transition-colors ${
          baseColorPopupOpen
            ? 'border-violet-500 bg-violet-100 text-violet-700'
            : 'border-transparent bg-white text-gray-500 hover:bg-gray-100 hover:text-gray-700'
        }`}
      >
        <FormatPaintIcon fontSize="small" />
        <span
          className="absolute bottom-1 right-1 w-2 h-2 rounded-full border border-white"
          style={{ backgroundColor: baseColor }}
        />
      </button>

      {/* 구분선 + Undo */}
      <div className="my-2 border-t border-gray-200" />
      <button
        title="실행 취소 (Undo)"
        onClick={onUndo}
        disabled={!canUndo}
        className={`flex items-center justify-center w-10 h-10 rounded-xl border transition-colors ${
          canUndo
            ? 'border-transparent bg-white text-gray-500 hover:bg-gray-100 hover:text-gray-700'
            : 'border-transparent bg-white text-gray-300 cursor-not-allowed'
        }`}
      >
        <UndoIcon fontSize="small" />
      </button>

      {/* 바탕색 팝업 */}
      {baseColorPopupOpen && (
        <div
          ref={baseColorPopupRef}
          className="absolute left-full top-0 ml-2 z-50 bg-white rounded-xl shadow-xl border border-gray-200 p-4 w-56"
          style={{ marginTop: '7rem' }}
        >
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-semibold text-gray-700">바탕 색상</p>
            <button
              onClick={() => setBaseColorPopupOpen(false)}
              className="text-gray-400 hover:text-gray-600 text-lg leading-none"
            >
              ×
            </button>
          </div>
          <div className="grid grid-cols-5 gap-1.5 mb-2">
            {PRESET_COLORS.map((c) => (
              <button
                key={c}
                onClick={() => onBaseColorChange(c)}
                className={`w-8 h-8 rounded-md border-2 transition-transform hover:scale-110 ${
                  baseColor === c ? 'border-violet-500 scale-110' : 'border-gray-200'
                }`}
                style={{ backgroundColor: c }}
              />
            ))}
          </div>
          <div className="flex items-center gap-2 mt-1">
            <input
              type="color"
              value={baseColor}
              onChange={(e) => onBaseColorChange(e.target.value)}
              className="w-8 h-8 rounded cursor-pointer border border-gray-200 p-0.5"
            />
            <span className="text-xs font-mono text-gray-500">{baseColor}</span>
          </div>
        </div>
      )}

      {/* 브러쉬/지우개 팝업 */}
      {showPopup && (
        <div
          ref={popupRef}
          className="absolute left-full top-0 ml-2 z-50 bg-white rounded-xl shadow-xl border border-gray-200 p-4 w-56"
        >
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-semibold text-gray-700">
              {value === 'brush' ? '브러쉬 설정' : '지우개 크기'}
            </p>
            <button
              onClick={() => setPopupOpen(false)}
              className="text-gray-400 hover:text-gray-600 text-lg leading-none"
            >
              ×
            </button>
          </div>

          {value === 'brush' && (
            <div className="mb-4">
              <p className="text-xs text-gray-500 mb-2">색상</p>
              <div className="grid grid-cols-5 gap-1.5 mb-2">
                {PRESET_COLORS.map((c) => (
                  <button
                    key={c}
                    onClick={() => onColorChange(c)}
                    className={`w-8 h-8 rounded-md border-2 transition-transform hover:scale-110 ${
                      color === c ? 'border-violet-500 scale-110' : 'border-gray-200'
                    }`}
                    style={{ backgroundColor: c }}
                  />
                ))}
              </div>
              <div className="flex items-center gap-2 mt-1">
                <input
                  type="color"
                  value={color}
                  onChange={(e) => onColorChange(e.target.value)}
                  className="w-8 h-8 rounded cursor-pointer border border-gray-200 p-0.5"
                />
                <span className="text-xs font-mono text-gray-500">{color}</span>
              </div>
            </div>
          )}

          <div>
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs text-gray-500">크기</p>
              <span className="text-xs font-semibold text-violet-600">{size}px</span>
            </div>
            <div className="flex items-center justify-center mb-2 bg-gray-50 rounded-lg" style={{ height: 68 }}>
              <div
                className="rounded-full"
                style={{
                  width: size,
                  height: size,
                  backgroundColor: value === 'brush' ? color : '#6b7280',
                }}
              />
            </div>
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
      )}
    </div>
  )
}
