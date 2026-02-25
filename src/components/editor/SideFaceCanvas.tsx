'use client'

import { useRef, useState, useCallback, useEffect } from 'react'
import { Stage, Layer, Line, Rect } from 'react-konva'
import type Konva from 'konva'
import type { Tool, CakeShape, LineData } from '@/types/cake'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import Paper from '@mui/material/Paper'

interface Props {
  containerWidth: number
  containerHeight?: number
  stageRef: React.RefObject<Konva.Stage | null>
  tool: Tool
  brushColor: string
  lineColor: string
  size: number
  cakeShape: CakeShape
  baseColor: string
  lines: LineData[]
  onLinesChange: React.Dispatch<React.SetStateAction<LineData[]>>
  onBeforeAction: () => void
  onUpdate?: () => void
  onUndo?: () => void
  vertical?: boolean
}

const CAKE_HEIGHT = 120
const RADIUS = 130
const CIRCUMFERENCE = Math.round(2 * Math.PI * RADIUS) // ~817px

function getSideWidth(shape: CakeShape) {
  if (shape === 'circle' || shape === 'heart') return Math.min(CIRCUMFERENCE, 600)
  return Math.min(RADIUS * 2 * 4, 600)
}

export default function SideFaceCanvas({
  containerWidth,
  containerHeight = 0,
  stageRef,
  tool,
  brushColor,
  lineColor,
  size,
  cakeShape,
  baseColor,
  lines,
  onLinesChange,
  onBeforeAction,
  onUpdate,
  onUndo,
  vertical = false,
}: Props) {
  const [cursor, setCursor] = useState<{ x: number; y: number } | null>(null)
  const isDrawing = useRef(false)
  const isLineMode = useRef(false)
  const currentId = useRef<string | null>(null)
  const startPos = useRef<{ x: number; y: number } | null>(null)
  const onBeforeActionRef = useRef(onBeforeAction)
  const isPinching = useRef(false)
  const twoFingerStart = useRef<number>(0)

  useEffect(() => {
    onBeforeActionRef.current = onBeforeAction
  }, [onBeforeAction])

  const CANVAS_W = getSideWidth(cakeShape)
  const stageW = vertical ? CAKE_HEIGHT : CANVAS_W
  const stageH = vertical ? CANVAS_W : CAKE_HEIGHT

  const notifyUpdate = useCallback(() => {
    setTimeout(() => onUpdate?.(), 50)
  }, [onUpdate])

  const handleMouseDown = useCallback(
    (e: Konva.KonvaEventObject<MouseEvent>) => {
      const pos = e.target.getStage()?.getPointerPosition()
      if (!pos) return

      onBeforeActionRef.current()
      isDrawing.current = true
      isLineMode.current = tool === 'line'
      startPos.current = { x: pos.x, y: pos.y }
      const id = `line-${Date.now()}`
      currentId.current = id

      onLinesChange((prev) => [
        ...prev,
        {
          id,
          points: [pos.x, pos.y, pos.x, pos.y],
          stroke: tool === 'eraser' ? '#ffffff' : tool === 'line' ? lineColor : brushColor,
          strokeWidth: size,
          globalCompositeOperation: tool === 'eraser' ? 'destination-out' : 'source-over',
        },
      ])
    },
    [tool, brushColor, lineColor, size, onLinesChange]
  )

  const handleMouseMove = useCallback(
    (e: Konva.KonvaEventObject<MouseEvent>) => {
      const pos = e.target.getStage()?.getPointerPosition()
      if (!pos) return

      setCursor({ x: pos.x, y: pos.y })

      if (!isDrawing.current || !currentId.current) return
      if (isLineMode.current && startPos.current) {
        onLinesChange((prev) =>
          prev.map((l) =>
            l.id === currentId.current
              ? { ...l, points: [startPos.current!.x, startPos.current!.y, pos.x, pos.y] }
              : l
          )
        )
      } else if (e.evt.shiftKey && startPos.current) {
        onLinesChange((prev) =>
          prev.map((l) =>
            l.id === currentId.current
              ? { ...l, points: [startPos.current!.x, startPos.current!.y, pos.x, pos.y] }
              : l
          )
        )
      } else {
        onLinesChange((prev) =>
          prev.map((l) =>
            l.id === currentId.current
              ? { ...l, points: [...l.points, pos.x, pos.y] }
              : l
          )
        )
      }
    },
    [onLinesChange]
  )

  const handleMouseUp = useCallback(() => {
    isDrawing.current = false
    currentId.current = null
    notifyUpdate()
  }, [notifyUpdate])

  const handleMouseLeave = useCallback(() => {
    setCursor(null)
  }, [])

  const handleTouchStart = useCallback(
    (e: Konva.KonvaEventObject<TouchEvent>) => {
      if (e.evt.touches.length >= 2) {
        isPinching.current = true
        twoFingerStart.current = Date.now()
        return
      }
      if (isPinching.current) return

      const pos = e.target.getStage()?.getPointerPosition()
      if (!pos) return

      onBeforeActionRef.current()
      isDrawing.current = true
      isLineMode.current = tool === 'line'
      startPos.current = { x: pos.x, y: pos.y }
      const id = `line-${Date.now()}`
      currentId.current = id
      setCursor(pos)

      onLinesChange((prev) => [
        ...prev,
        {
          id,
          points: [pos.x, pos.y, pos.x, pos.y],
          stroke: tool === 'eraser' ? '#ffffff' : tool === 'line' ? lineColor : brushColor,
          strokeWidth: size,
          globalCompositeOperation: tool === 'eraser' ? 'destination-out' : 'source-over',
        },
      ])
    },
    [tool, brushColor, lineColor, size, onLinesChange]
  )

  const handleTouchMove = useCallback(
    (e: Konva.KonvaEventObject<TouchEvent>) => {
      if (isPinching.current) return
      const pos = e.target.getStage()?.getPointerPosition()
      if (!pos) return

      setCursor(pos)

      if (!isDrawing.current || !currentId.current) return
      if (isLineMode.current && startPos.current) {
        onLinesChange((prev) =>
          prev.map((l) =>
            l.id === currentId.current
              ? { ...l, points: [startPos.current!.x, startPos.current!.y, pos.x, pos.y] }
              : l
          )
        )
      } else {
        onLinesChange((prev) =>
          prev.map((l) =>
            l.id === currentId.current
              ? { ...l, points: [...l.points, pos.x, pos.y] }
              : l
          )
        )
      }
    },
    [onLinesChange]
  )

  const handleTouchEnd = useCallback((e: Konva.KonvaEventObject<TouchEvent>) => {
    if (isPinching.current && e.evt.touches.length === 0) {
      const elapsed = Date.now() - twoFingerStart.current
      isPinching.current = false
      if (elapsed < 300) {
        onUndo?.()
      }
      return
    }
    isDrawing.current = false
    currentId.current = null
    setCursor(null)
    notifyUpdate()
  }, [notifyUpdate, onUndo])

  const labelH = 28 // approximate height of the label above
  const scaleByW = containerWidth > 0 ? containerWidth / stageW : 1
  const scaleByH = vertical && containerHeight > 0 ? (containerHeight - labelH) / stageH : Infinity
  const scale = Math.min(1, scaleByW, scaleByH)

  return (
    <Stack alignItems="center">
      <Typography variant="caption" sx={{ fontWeight: 600, color: 'text.secondary', textTransform: 'uppercase', letterSpacing: 1, mb: 1 }}>
        옆면 전개도 {cakeShape === 'circle' ? '(원주 펼침)' : cakeShape === 'square' ? '(4면 전개도)' : '(하트 둘레)'}
      </Typography>
      <div style={{ width: stageW * scale, height: stageH * scale }}>
      <Paper
        variant="outlined"
        sx={{
          position: 'relative',
          borderRadius: 0,
          overflow: 'hidden',
          borderWidth: 1.5,
          borderColor: 'grey.200',
          width: stageW,
          height: stageH,
          transform: `scale(${scale})`,
          transformOrigin: 'top left',
          bgcolor: 'background.paper',
        }}
      >
        <Stage
          ref={stageRef}
          width={stageW}
          height={stageH}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseLeave}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          style={{ cursor: tool === 'line' ? 'crosshair' : 'none', touchAction: 'none' }}
        >
          {/* 레이어 1: 바탕 */}
          <Layer listening={false}>
            <Rect x={0} y={0} width={stageW} height={stageH} fill={baseColor} />
          </Layer>

          {/* 레이어 2: 그림 */}
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
        {/* 브러쉬/지우개 커서 — Konva 외부 CSS 오버레이 */}
        {cursor && (tool === 'brush' || tool === 'eraser') && (
          <div
            style={{
              position: 'absolute',
              left: cursor.x - size / 2,
              top: cursor.y - size / 2,
              width: size,
              height: size,
              borderRadius: '50%',
              border: `1px solid ${tool === 'eraser' ? '#9ca3af' : brushColor}`,
              pointerEvents: 'none',
            }}
          />
        )}
      </Paper>
      </div>
    </Stack>
  )
}
