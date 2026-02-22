'use client'

import { useRef, useState, useCallback } from 'react'
import { Stage, Layer, Line, Rect, Circle, Group, Image as KonvaImage } from 'react-konva'
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

interface FillSnapshot {
  id: string
  imageEl: HTMLImageElement
}

export default function TopFaceCanvas({ stageRef, tool, color, size, cakeShape, baseColor, onUpdate }: Props) {
  const [lines, setLines] = useState<LineData[]>([])
  const [snapshots, setSnapshots] = useState<FillSnapshot[]>([])
  const [cursor, setCursor] = useState<{ x: number; y: number } | null>(null)
  const isDrawing = useRef(false)
  const currentId = useRef<string | null>(null)
  const startPos = useRef<{ x: number; y: number } | null>(null)

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

      const [fr, fg, fb] = hexToRgb(color)
      if (targetR === fr && targetG === fg && targetB === fb && targetA === 255) return

      const visited = new Uint8Array(w * h)
      const queue: number[] = [px + py * w]
      visited[px + py * w] = 1

      const TOLERANCE = 30
      const isSimilar = (i: number) =>
        Math.abs(data[i] - targetR) <= TOLERANCE &&
        Math.abs(data[i + 1] - targetG) <= TOLERANCE &&
        Math.abs(data[i + 2] - targetB) <= TOLERANCE &&
        Math.abs(data[i + 3] - targetA) <= TOLERANCE

      while (queue.length) {
        const pos = queue.pop()!
        const x = pos % w
        const y = Math.floor(pos / w)
        const i = pos * 4
        data[i] = fr
        data[i + 1] = fg
        data[i + 2] = fb
        data[i + 3] = 255

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

      ctx.putImageData(imgData, 0, 0)

      const dataUrl = canvas.toDataURL()
      const img = new window.Image()
      img.onload = () => {
        setSnapshots((prev) => [...prev, { id: `snapshot-${Date.now()}`, imageEl: img }])
        notifyUpdate()
      }
      img.src = dataUrl
    },
    [color, stageRef, notifyUpdate]
  )

  const handleMouseDown = useCallback(
    (e: Konva.KonvaEventObject<MouseEvent>) => {
      const pos = e.target.getStage()?.getPointerPosition()
      if (!pos) return

      if (tool === 'fill') {
        floodFill(pos.x, pos.y)
        return
      }

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
    [tool, color, size, floodFill]
  )

  const handleMouseMove = useCallback(
    (e: Konva.KonvaEventObject<MouseEvent>) => {
      const pos = e.target.getStage()?.getPointerPosition()
      if (!pos) return

      // 커서 가이드 업데이트
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

  const handleMouseLeave = useCallback(() => {
    setCursor(null)
  }, [])

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
          style={{ cursor: tool === 'fill' ? 'crosshair' : 'none' }}
        >
          <Layer>
            <Rect x={0} y={0} width={CANVAS_SIZE} height={CANVAS_SIZE} fill="#fdf4ff" />

            <Group clipFunc={clipFunc as never}>
              <Rect x={0} y={0} width={CANVAS_SIZE} height={CANVAS_SIZE} fill={baseColor} />

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
              border: `1px solid ${tool === 'eraser' ? '#9ca3af' : color}`,
              pointerEvents: 'none',
            }}
          />
        )}
      </div>
    </div>
  )
}
