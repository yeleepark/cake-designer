'use client'

import { useState, useCallback, useRef, forwardRef, useImperativeHandle } from 'react'
import type Konva from 'konva'
import type { Tool, CakeShape, LineData, FillSnapshot, StampType, StampData } from '@/types/cake'
import { useContainerSize } from '@/hooks/useContainerSize'
import TopFaceCanvas from './TopFaceCanvas'
import SideFaceCanvas from './SideFaceCanvas'

interface HistoryEntry {
  topLines: LineData[]
  topSnapshots: FillSnapshot[]
  topStamps: StampData[]
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
  stampColor: string
  stampType: StampType
  stampSize: number
  topRef: React.RefObject<Konva.Stage | null>
  sideRef: React.RefObject<Konva.Stage | null>
  onUndoChange?: (canUndo: boolean) => void
  onUpdate?: () => void
}

const DrawingPanel = forwardRef<DrawingPanelHandle, Props>(function DrawingPanel(
  { tool, brushColor, lineColor, fillColor, size, cakeShape, baseColor, stampColor, stampType, stampSize, topRef, sideRef, onUndoChange, onUpdate },
  ref
) {
  const [topLines, setTopLines] = useState<LineData[]>([])
  const [topSnapshots, setTopSnapshots] = useState<FillSnapshot[]>([])
  const [topStamps, setTopStamps] = useState<StampData[]>([])
  const [sideLines, setSideLines] = useState<LineData[]>([])
  const [canvasTab, setCanvasTab] = useState<'top' | 'side'>('top')

  // history는 ref로 관리 (불필요한 리렌더 방지)
  const history = useRef<HistoryEntry[]>([])

  // 최신 상태를 ref로 추적 (pushHistory 클로저에서 항상 최신 값 사용)
  const topLinesRef = useRef(topLines)
  const topSnapshotsRef = useRef(topSnapshots)
  const topStampsRef = useRef(topStamps)
  const sideLinesRef = useRef(sideLines)
  topLinesRef.current = topLines
  topSnapshotsRef.current = topSnapshots
  topStampsRef.current = topStamps
  sideLinesRef.current = sideLines

  const pushHistory = useCallback(() => {
    history.current.push({
      topLines: [...topLinesRef.current],
      topSnapshots: [...topSnapshotsRef.current],
      topStamps: [...topStampsRef.current],
      sideLines: [...sideLinesRef.current],
    })
    onUndoChange?.(true)
  }, [onUndoChange])

  const undo = useCallback(() => {
    if (history.current.length === 0) return
    const prev = history.current.pop()!
    setTopLines(prev.topLines)
    setTopSnapshots(prev.topSnapshots)
    setTopStamps(prev.topStamps)
    setSideLines(prev.sideLines)
    onUndoChange?.(history.current.length > 0)
    setTimeout(() => onUpdate?.(), 50)
  }, [onUndoChange, onUpdate])

  useImperativeHandle(ref, () => ({ undo }), [undo])

  const containerRef = useRef<HTMLDivElement>(null)
  const containerWidth = useContainerSize(containerRef)

  return (
    <div ref={containerRef} className="flex flex-col md:gap-6">
      {/* 모바일 캔버스 탭 (윗면/옆면 전환) */}
      <div className="flex md:hidden mb-3 bg-gray-100 rounded-lg p-0.5">
        <button
          onClick={() => setCanvasTab('top')}
          className={`flex-1 py-1.5 text-xs font-semibold rounded-md transition-colors ${
            canvasTab === 'top'
              ? 'bg-white text-violet-600 shadow-sm'
              : 'text-gray-500'
          }`}
        >
          윗면
        </button>
        <button
          onClick={() => setCanvasTab('side')}
          className={`flex-1 py-1.5 text-xs font-semibold rounded-md transition-colors ${
            canvasTab === 'side'
              ? 'bg-white text-violet-600 shadow-sm'
              : 'text-gray-500'
          }`}
        >
          옆면
        </button>
      </div>

      <div className={`${canvasTab !== 'top' ? 'hidden' : ''} md:block`}>
        <TopFaceCanvas
          containerWidth={containerWidth}
          stageRef={topRef}
          tool={tool}
          brushColor={brushColor}
          lineColor={lineColor}
          fillColor={fillColor}
          size={size}
          cakeShape={cakeShape}
          baseColor={baseColor}
          stampColor={stampColor}
          stampType={stampType}
          stampSize={stampSize}
          stamps={topStamps}
          onStampsChange={setTopStamps}
          lines={topLines}
          snapshots={topSnapshots}
          onLinesChange={setTopLines}
          onSnapshotsChange={setTopSnapshots}
          onBeforeAction={pushHistory}
          onUpdate={onUpdate}
          onUndo={undo}
        />
      </div>
      <div className={`${canvasTab !== 'side' ? 'hidden' : ''} md:block`}>
        <SideFaceCanvas
          containerWidth={containerWidth}
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
          onUndo={undo}
        />
      </div>
    </div>
  )
})

export default DrawingPanel
