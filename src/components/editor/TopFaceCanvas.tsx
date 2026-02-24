'use client'

import { useRef, useState, useCallback, useEffect } from 'react'
import { Stage, Layer, Line, Rect, Circle, Group, Image as KonvaImage, Shape } from 'react-konva'
import type Konva from 'konva'
import type { Tool, CakeShape, LineData, FillSnapshot, StampType, StampData } from '@/types/cake'

interface Props {
  stageRef: React.RefObject<Konva.Stage | null>
  tool: Tool
  brushColor: string
  lineColor: string
  fillColor: string
  size: number
  cakeShape: CakeShape
  baseColor: string
  stampColor: string
  stampType: StampType
  stampSize: number
  stamps: StampData[]
  onStampsChange: React.Dispatch<React.SetStateAction<StampData[]>>
  lines: LineData[]
  snapshots: FillSnapshot[]
  onLinesChange: React.Dispatch<React.SetStateAction<LineData[]>>
  onSnapshotsChange: React.Dispatch<React.SetStateAction<FillSnapshot[]>>
  onBeforeAction: () => void
  onUpdate?: () => void
}

const CANVAS_SIZE = 300
const RADIUS = 130

function hexToRgb(hex: string): [number, number, number] {
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  return [r, g, b]
}

function getClipFunc(shape: CakeShape) {
  const cx = CANVAS_SIZE / 2
  const cy = CANVAS_SIZE / 2

  return (ctx: CanvasRenderingContext2D) => {
    ctx.beginPath()
    if (shape === 'circle') {
      ctx.arc(cx, cy, RADIUS, 0, Math.PI * 2)
    } else {
      ctx.rect(cx - RADIUS, cy - RADIUS, RADIUS * 2, RADIUS * 2)
    }
    ctx.closePath()
  }
}

function drawHeart(ctx: CanvasRenderingContext2D, size: number) {
  const s = size / 2
  ctx.beginPath()
  ctx.moveTo(0, s * 0.7)
  // left half: bottom → left bump → top center dip
  ctx.bezierCurveTo(-s * 0.55, s * 0.35, -s, -s * 0.1, -s * 0.5, -s * 0.5)
  ctx.bezierCurveTo(-s * 0.15, -s * 0.8, 0, -s * 0.5, 0, -s * 0.2)
  // right half: top center dip → right bump → bottom
  ctx.bezierCurveTo(0, -s * 0.5, s * 0.15, -s * 0.8, s * 0.5, -s * 0.5)
  ctx.bezierCurveTo(s, -s * 0.1, s * 0.55, s * 0.35, 0, s * 0.7)
  ctx.closePath()
}

function drawStar(ctx: CanvasRenderingContext2D, size: number) {
  const outer = size / 2
  const inner = outer * 0.4
  const spikes = 5
  ctx.beginPath()
  for (let i = 0; i < spikes * 2; i++) {
    const r = i % 2 === 0 ? outer : inner
    const angle = (Math.PI / 2) * -1 + (Math.PI / spikes) * i
    const x = Math.cos(angle) * r
    const y = Math.sin(angle) * r
    if (i === 0) ctx.moveTo(x, y)
    else ctx.lineTo(x, y)
  }
  ctx.closePath()
}

function drawConfetti(ctx: CanvasRenderingContext2D, size: number) {
  const w = size * 0.3
  const h = size
  ctx.save()
  ctx.rotate(Math.PI / 6)
  ctx.beginPath()
  ctx.roundRect(-w / 2, -h / 2, w, h, w * 0.3)
  ctx.closePath()
  ctx.restore()
}

export default function TopFaceCanvas({
  stageRef,
  tool,
  brushColor,
  lineColor,
  fillColor,
  size,
  cakeShape,
  baseColor,
  stampColor,
  stampType,
  stampSize,
  stamps,
  onStampsChange,
  lines,
  snapshots,
  onLinesChange,
  onSnapshotsChange,
  onBeforeAction,
  onUpdate,
}: Props) {
  const [cursor, setCursor] = useState<{ x: number; y: number } | null>(null)
  const isDrawing = useRef(false)
  const isLineMode = useRef(false)
  const currentId = useRef<string | null>(null)
  const startPos = useRef<{ x: number; y: number } | null>(null)
  const onBeforeActionRef = useRef(onBeforeAction)

  useEffect(() => {
    onBeforeActionRef.current = onBeforeAction
  }, [onBeforeAction])

  const notifyUpdate = useCallback(() => {
    setTimeout(() => onUpdate?.(), 50)
  }, [onUpdate])

  const floodFill = useCallback(
    (startX: number, startY: number) => {
      const stage = stageRef.current
      if (!stage) return

      const canvas = stage.toCanvas()
      const ctx = canvas.getContext('2d')
      if (!ctx) return

      const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height)
      const data = imgData.data
      const w = canvas.width
      const h = canvas.height
      const px = Math.floor(startX)
      const py = Math.floor(startY)
      if (px < 0 || px >= w || py < 0 || py >= h) return

      const baseIdx = (py * w + px) * 4
      const targetR = data[baseIdx]
      const targetG = data[baseIdx + 1]
      const targetB = data[baseIdx + 2]
      const targetA = data[baseIdx + 3]

      const [fr, fg, fb] = hexToRgb(fillColor)
      if (targetR === fr && targetG === fg && targetB === fb && targetA === 255) return

      onBeforeActionRef.current()

      const visited = new Uint8Array(w * h)
      const queue: number[] = [px + py * w]
      visited[px + py * w] = 1

      const TOLERANCE = 30
      const isSimilar = (i: number) =>
        Math.abs(data[i] - targetR) <= TOLERANCE &&
        Math.abs(data[i + 1] - targetG) <= TOLERANCE &&
        Math.abs(data[i + 2] - targetB) <= TOLERANCE &&
        Math.abs(data[i + 3] - targetA) <= TOLERANCE

      const filledPixels = new Uint8Array(w * h)

      while (queue.length) {
        const pos = queue.pop()!
        const x = pos % w
        const y = Math.floor(pos / w)
        const i = pos * 4
        data[i] = fr
        data[i + 1] = fg
        data[i + 2] = fb
        data[i + 3] = 255
        filledPixels[pos] = 1

        for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
          const nx = x + dx
          const ny = y + dy
          if (nx < 0 || nx >= w || ny < 0 || ny >= h) continue
          const npos = nx + ny * w
          if (visited[npos]) continue
          if (isSimilar(npos * 4)) {
            visited[npos] = 1
            queue.push(npos)
          }
        }
      }

      // 칠해진 픽셀만 저장 (나머지 투명) — 바탕색 변경 시 뒤 rect가 정확히 보이도록
      const fillCanvas = document.createElement('canvas')
      fillCanvas.width = w
      fillCanvas.height = h
      const fillCtx = fillCanvas.getContext('2d')!
      const fillImageData = fillCtx.createImageData(w, h)
      const fd = fillImageData.data
      for (let pos = 0; pos < w * h; pos++) {
        if (filledPixels[pos]) {
          const si = pos * 4
          fd[si] = fr
          fd[si + 1] = fg
          fd[si + 2] = fb
          fd[si + 3] = 255
        }
      }
      fillCtx.putImageData(fillImageData, 0, 0)

      const dataUrl = fillCanvas.toDataURL()
      const img = new window.Image()
      img.onload = () => {
        onSnapshotsChange((prev) => [...prev, { id: `snapshot-${Date.now()}`, imageEl: img }])
        notifyUpdate()
      }
      img.src = dataUrl
    },
    [fillColor, stageRef, notifyUpdate, onSnapshotsChange]
  )

  const handleMouseDown = useCallback(
    (e: Konva.KonvaEventObject<MouseEvent>) => {
      const pos = e.target.getStage()?.getPointerPosition()
      if (!pos) return

      if (tool === 'fill') {
        floodFill(pos.x, pos.y)
        return
      }

      if (tool === 'stamp') {
        onBeforeActionRef.current()
        onStampsChange((prev) => [
          ...prev,
          { id: `stamp-${Date.now()}`, type: stampType, x: pos.x, y: pos.y, size: stampSize, color: stampColor },
        ])
        notifyUpdate()
        return
      }

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
    [tool, brushColor, lineColor, size, stampColor, stampType, stampSize, floodFill, onLinesChange, onStampsChange, notifyUpdate]
  )

  const handleMouseMove = useCallback(
    (e: Konva.KonvaEventObject<MouseEvent>) => {
      const pos = e.target.getStage()?.getPointerPosition()
      if (!pos) return

      // 커서 가이드 업데이트
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

  const handleMouseLeave = useCallback(() => {
    setCursor(null)
  }, [])

  const handleTouchStart = useCallback(
    (e: Konva.KonvaEventObject<TouchEvent>) => {
      const pos = e.target.getStage()?.getPointerPosition()
      if (!pos) return

      if (tool === 'fill') {
        floodFill(pos.x, pos.y)
        return
      }

      if (tool === 'stamp') {
        onBeforeActionRef.current()
        onStampsChange((prev) => [
          ...prev,
          { id: `stamp-${Date.now()}`, type: stampType, x: pos.x, y: pos.y, size: stampSize, color: stampColor },
        ])
        notifyUpdate()
        return
      }

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
    [tool, brushColor, lineColor, size, stampColor, stampType, stampSize, floodFill, onLinesChange, onStampsChange, notifyUpdate]
  )

  const handleTouchMove = useCallback(
    (e: Konva.KonvaEventObject<TouchEvent>) => {
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

  const handleTouchEnd = useCallback(() => {
    isDrawing.current = false
    currentId.current = null
    setCursor(null)
    notifyUpdate()
  }, [notifyUpdate])

  const handleMouseUp = useCallback(() => {
    isDrawing.current = false
    currentId.current = null
    notifyUpdate()
  }, [notifyUpdate])

  const clipFunc = getClipFunc(cakeShape)

  return (
    <div className="flex flex-col items-center">
      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
        윗면 {cakeShape === 'circle' ? '(원형)' : '(사각형)'}
      </p>
      <div className="relative rounded-xl overflow-hidden border-2 border-gray-200 shadow-sm bg-white">
        <Stage
          ref={stageRef}
          width={CANVAS_SIZE}
          height={CANVAS_SIZE}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseLeave}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          style={{ cursor: (tool === 'fill' || tool === 'line' || tool === 'stamp') ? 'crosshair' : 'none', touchAction: 'none' }}
        >
          {/* 레이어 1: 바탕 — 지우개(destination-out)에 영향받지 않음 */}
          <Layer listening={false}>
            <Rect x={0} y={0} width={CANVAS_SIZE} height={CANVAS_SIZE} fill="#fdf4ff" />
            <Group clipFunc={clipFunc as never}>
              <Rect x={0} y={0} width={CANVAS_SIZE} height={CANVAS_SIZE} fill={baseColor} />
            </Group>
          </Layer>

          {/* 레이어 2: 그림 — 지우개는 이 레이어만 지움 */}
          <Layer>
            <Group clipFunc={clipFunc as never}>
              {snapshots.map((s) => (
                <KonvaImage
                  key={s.id}
                  image={s.imageEl}
                  x={0}
                  y={0}
                  width={CANVAS_SIZE}
                  height={CANVAS_SIZE}
                />
              ))}

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

              {stamps.map((stamp) => (
                <Shape
                  key={stamp.id}
                  x={stamp.x}
                  y={stamp.y}
                  fill={stamp.color}
                  listening={false}
                  sceneFunc={(ctx, shape) => {
                    if (stamp.type === 'heart') drawHeart(ctx as unknown as CanvasRenderingContext2D, stamp.size)
                    else if (stamp.type === 'star') drawStar(ctx as unknown as CanvasRenderingContext2D, stamp.size)
                    else drawConfetti(ctx as unknown as CanvasRenderingContext2D, stamp.size)
                    ctx.fillStrokeShape(shape)
                  }}
                />
              ))}
            </Group>

            {/* 케이크 윤곽선 */}
            {cakeShape === 'circle' && (
              <Circle
                x={CANVAS_SIZE / 2}
                y={CANVAS_SIZE / 2}
                radius={RADIUS}
                stroke="#d1d5db"
                strokeWidth={2}
                fill="transparent"
                listening={false}
              />
            )}
            {cakeShape === 'square' && (
              <Rect
                x={CANVAS_SIZE / 2 - RADIUS}
                y={CANVAS_SIZE / 2 - RADIUS}
                width={RADIUS * 2}
                height={RADIUS * 2}
                stroke="#d1d5db"
                strokeWidth={2}
                fill="transparent"
                listening={false}
              />
            )}
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
              border: `1px solid ${tool === 'eraser' ? '#9ca3af' : brushColor}`,
              pointerEvents: 'none',
            }}
          />
        )}
      </div>
    </div>
  )
}
