'use client'

import { useRef, useState, useCallback } from 'react'
import { Stage, Layer, Line, Rect } from 'react-konva'
import type Konva from 'konva'
import type { Tool, CakeShape, LineData } from '@/types/cake'

interface Props {
  stageRef: React.RefObject<Konva.Stage | null>
  tool: Tool
  color: string
  size: number
  cakeShape: CakeShape
  baseColor: string
  onUpdate?: () => void
}

const CAKE_HEIGHT = 120
const RADIUS = 130
const CIRCUMFERENCE = Math.round(2 * Math.PI * RADIUS) // ~817px

function getSideWidth(shape: CakeShape) {
  if (shape === 'circle') return Math.min(CIRCUMFERENCE, 600)
  return Math.min(RADIUS * 2 * 4, 600)
}

export default function SideFaceCanvas({ stageRef, tool, color, size, cakeShape, baseColor, onUpdate }: Props) {
  const [lines, setLines] = useState<LineData[]>([])
  const [cursor, setCursor] = useState<{ x: number; y: number } | null>(null)
  const isDrawing = useRef(false)
  const currentId = useRef<string | null>(null)
  const startPos = useRef<{ x: number; y: number } | null>(null)

  const CANVAS_W = getSideWidth(cakeShape)

  const notifyUpdate = useCallback(() => {
    setTimeout(() => onUpdate?.(), 50)
  }, [onUpdate])

  const handleMouseDown = useCallback(
    (e: Konva.KonvaEventObject<MouseEvent>) => {
      const pos = e.target.getStage()?.getPointerPosition()
      if (!pos) return

      isDrawing.current = true
      startPos.current = { x: pos.x, y: pos.y }
      const id = `line-${Date.now()}`
      currentId.current = id

      setLines((prev) => [
        ...prev,
        {
          id,
          points: [pos.x, pos.y],
          stroke: tool === 'eraser' ? '#ffffff' : color,
          strokeWidth: size,
          globalCompositeOperation: tool === 'eraser' ? 'destination-out' : 'source-over',
        },
      ])
    },
    [tool, color, size]
  )

  const handleMouseMove = useCallback(
    (e: Konva.KonvaEventObject<MouseEvent>) => {
      const pos = e.target.getStage()?.getPointerPosition()
      if (!pos) return

      setCursor({ x: pos.x, y: pos.y })

      if (!isDrawing.current || !currentId.current) return
      if (e.evt.shiftKey && startPos.current) {
        setLines((prev) =>
          prev.map((l) =>
            l.id === currentId.current
              ? { ...l, points: [startPos.current!.x, startPos.current!.y, pos.x, pos.y] }
              : l
          )
        )
      } else {
        setLines((prev) =>
          prev.map((l) =>
            l.id === currentId.current
              ? { ...l, points: [...l.points, pos.x, pos.y] }
              : l
          )
        )
      }
    },
    []
  )

  const handleMouseUp = useCallback(() => {
    isDrawing.current = false
    currentId.current = null
    notifyUpdate()
  }, [notifyUpdate])

  const handleMouseLeave = useCallback(() => {
    setCursor(null)
  }, [])

  return (
    <div className="flex flex-col items-center">
      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
        옆면 전개도 {cakeShape === 'circle' ? '(원주 펼침)' : '(4면 전개도)'}
      </p>
      <div className="relative rounded-xl overflow-hidden border-2 border-gray-200 shadow-sm bg-white overflow-x-auto">
        <Stage
          ref={stageRef}
          width={CANVAS_W}
          height={CAKE_HEIGHT}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseLeave}
          style={{ cursor: 'none' }}
        >
          {/* 레이어 1: 바탕 — 지우개(destination-out)에 영향받지 않음 */}
          <Layer listening={false}>
            <Rect x={0} y={0} width={CANVAS_W} height={CAKE_HEIGHT} fill={baseColor} />
          </Layer>

          {/* 레이어 2: 그림 — 지우개는 이 레이어만 지움 */}
          <Layer>
            {lines.map((line) => (
              <Line
                key={line.id}
                points={line.points}
                stroke={line.stroke}
                strokeWidth={line.strokeWidth}
                tension={0.5}
                lineCap="round"
                lineJoin="round"
                globalCompositeOperation={line.globalCompositeOperation}
              />
            ))}
          </Layer>
        </Stage>
        {/* 브러쉬/지우개 커서 — Konva 외부 CSS 오버레이 (texture 캡처에서 제외) */}
        {cursor && (tool === 'brush' || tool === 'eraser') && (
          <div
            style={{
              position: 'absolute',
              left: cursor.x - size / 2,
              top: cursor.y - size / 2,
              width: size,
              height: size,
              borderRadius: '50%',
              border: `1px solid ${tool === 'eraser' ? '#9ca3af' : color}`,
              pointerEvents: 'none',
            }}
          />
        )}
      </div>
    </div>
  )
}
