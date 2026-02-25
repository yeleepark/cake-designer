'use client'

import { useState, useCallback, useRef, forwardRef, useImperativeHandle } from 'react'
import type Konva from 'konva'
import type { Tool, CakeShape, LineData, FillSnapshot, StampType, StampData } from '@/types/cake'
import type { DeviceType } from '@/hooks/useDeviceType'
import { useContainerSize } from '@/hooks/useContainerSize'
import Box from '@mui/material/Box'
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup'
import ToggleButton from '@mui/material/ToggleButton'
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
  device: DeviceType
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
  { device, tool, brushColor, lineColor, fillColor, size, cakeShape, baseColor, stampColor, stampType, stampSize, topRef, sideRef, onUndoChange, onUpdate },
  ref
) {
  const [topLines, setTopLines] = useState<LineData[]>([])
  const [topSnapshots, setTopSnapshots] = useState<FillSnapshot[]>([])
  const [topStamps, setTopStamps] = useState<StampData[]>([])
  const [sideLines, setSideLines] = useState<LineData[]>([])
  const [canvasTab, setCanvasTab] = useState<'top' | 'side'>('top')

  const history = useRef<HistoryEntry[]>([])

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
  const { width: containerWidth, height: containerHeight } = useContainerSize(containerRef)

  const isMobile = device === 'mobile'

  return (
    <Box ref={containerRef} sx={{ display: 'flex', flexDirection: 'column', gap: isMobile ? 0 : 3, ...(isMobile ? { flex: 1, minHeight: 0 } : {}) }}>
      {/* 모바일 캔버스 탭 (윗면/옆면 전환) */}
      {isMobile && (
        <Box sx={{ display: 'flex', mb: 1.5 }}>
          <ToggleButtonGroup
            exclusive
            value={canvasTab}
            onChange={(_, v) => v && setCanvasTab(v)}
            fullWidth
            size="small"
            sx={{
              bgcolor: 'grey.100',
              borderRadius: 3,
              p: 0.5,
              '& .MuiToggleButton-root': {
                border: 'none',
                borderRadius: '10px !important',
                fontSize: '0.75rem',
                fontWeight: 600,
                py: 0.75,
                textTransform: 'none',
                transition: 'all 0.2s ease',
                '&.Mui-selected': {
                  bgcolor: 'background.paper',
                  color: 'primary.main',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
                },
              },
            }}
          >
            <ToggleButton value="top">윗면</ToggleButton>
            <ToggleButton value="side">옆면</ToggleButton>
          </ToggleButtonGroup>
        </Box>
      )}

      <Box sx={{ display: isMobile && canvasTab !== 'top' ? 'none' : 'block', ...(isMobile ? { flex: 1, minHeight: 0, overflow: 'auto' } : {}) }}>
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
      </Box>
      <Box sx={{ display: isMobile && canvasTab !== 'side' ? 'none' : isMobile ? 'flex' : 'block', ...(isMobile ? { flex: 1, minHeight: 0, flexDirection: 'column' } : {}) }}>
        <SideFaceCanvas
          containerWidth={containerWidth}
          containerHeight={containerHeight}
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
          vertical={isMobile}
        />
      </Box>
    </Box>
  )
})

export default DrawingPanel
