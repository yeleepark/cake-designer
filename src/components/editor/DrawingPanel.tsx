'use client'

import { useState, useCallback, useRef, forwardRef, useImperativeHandle } from 'react'
import type Konva from 'konva'
import type { Tool, CakeShape, LineData, FillSnapshot } from '@/types/cake'
import TopFaceCanvas from './TopFaceCanvas'
import SideFaceCanvas from './SideFaceCanvas'

interface HistoryEntry {
  topLines: LineData[]
  topSnapshots: FillSnapshot[]
  sideLines: LineData[]
}

export interface DrawingPanelHandle {
  undo: () => void
}

interface Props {
  tool: Tool
  brushColor: string
  lineColor: string
  fillColor: string
  size: number
  cakeShape: CakeShape
  baseColor: string
  topRef: React.RefObject<Konva.Stage | null>
  sideRef: React.RefObject<Konva.Stage | null>
  onUndoChange?: (canUndo: boolean) => void
  onUpdate?: () => void
}

const DrawingPanel = forwardRef<DrawingPanelHandle, Props>(function DrawingPanel(
  { tool, brushColor, lineColor, fillColor, size, cakeShape, baseColor, topRef, sideRef, onUndoChange, onUpdate },
  ref
) {
  const [topLines, setTopLines] = useState<LineData[]>([])
  const [topSnapshots, setTopSnapshots] = useState<FillSnapshot[]>([])
  const [sideLines, setSideLines] = useState<LineData[]>([])

  // history는 ref로 관리 (불필요한 리렌더 방지)
  const history = useRef<HistoryEntry[]>([])

  // 최신 상태를 ref로 추적 (pushHistory 클로저에서 항상 최신 값 사용)
  const topLinesRef = useRef(topLines)
  const topSnapshotsRef = useRef(topSnapshots)
  const sideLinesRef = useRef(sideLines)
  topLinesRef.current = topLines
  topSnapshotsRef.current = topSnapshots
  sideLinesRef.current = sideLines

  const pushHistory = useCallback(() => {
    history.current.push({
      topLines: [...topLinesRef.current],
      topSnapshots: [...topSnapshotsRef.current],
      sideLines: [...sideLinesRef.current],
    })
    onUndoChange?.(true)
  }, [onUndoChange])

  const undo = useCallback(() => {
    if (history.current.length === 0) return
    const prev = history.current.pop()!
    setTopLines(prev.topLines)
    setTopSnapshots(prev.topSnapshots)
    setSideLines(prev.sideLines)
    onUndoChange?.(history.current.length > 0)
    setTimeout(() => onUpdate?.(), 50)
  }, [onUndoChange, onUpdate])

  useImperativeHandle(ref, () => ({ undo }), [undo])

  return (
    <div className="flex flex-col gap-6">
      <TopFaceCanvas
        stageRef={topRef}
        tool={tool}
        brushColor={brushColor}
        lineColor={lineColor}
        fillColor={fillColor}
        size={size}
        cakeShape={cakeShape}
        baseColor={baseColor}
        lines={topLines}
        snapshots={topSnapshots}
        onLinesChange={setTopLines}
        onSnapshotsChange={setTopSnapshots}
        onBeforeAction={pushHistory}
        onUpdate={onUpdate}
      />
      <SideFaceCanvas
        stageRef={sideRef}
        tool={tool}
        brushColor={brushColor}
        lineColor={lineColor}
        size={size}
        cakeShape={cakeShape}
        baseColor={baseColor}
        lines={sideLines}
        onLinesChange={setSideLines}
        onBeforeAction={pushHistory}
        onUpdate={onUpdate}
      />
    </div>
  )
})

export default DrawingPanel
