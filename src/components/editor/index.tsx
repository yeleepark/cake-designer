'use client'

import { useState, useCallback, useRef, useEffect } from 'react'
import type { CakeShape } from '@/types/cake'
import dynamic from 'next/dynamic'
import { useDrawing } from '@/hooks/useDrawing'
import { useExport } from '@/hooks/useExport'
import Toolbar from './Toolbar'
import CakeShapeSelector from './CakeShapeSelector'
import DrawingPanel, { type DrawingPanelHandle } from './DrawingPanel'

const CakePreview3D = dynamic(() => import('@/components/preview/CakePreview3D'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full min-h-[400px] flex items-center justify-center bg-gray-50 rounded-xl">
      <p className="text-gray-400 text-sm">3D 미리보기 로딩 중...</p>
    </div>
  ),
})

export default function Editor() {
  const { tool, setTool, color, setColor, size, setSize, cakeShape, setCakeShape, baseColor, setBaseColor, topRef, sideRef } =
    useDrawing()
  const threeCanvasRef = useRef<HTMLCanvasElement | null>(null)
  const { exportToPNG } = useExport(topRef, sideRef, threeCanvasRef)
  const [updateTick, setUpdateTick] = useState(0)
  const drawingPanelRef = useRef<DrawingPanelHandle>(null)
  const [canUndo, setCanUndo] = useState(false)

  const handleUpdate = useCallback(() => {
    setUpdateTick((t) => t + 1)
  }, [])

  // 케이크 모양 변경 시 Konva가 새 clipFunc로 다시 그릴 시간을 준 뒤 텍스처 갱신
  const handleShapeChange = useCallback((shape: CakeShape) => {
    setCakeShape(shape)
    setTimeout(() => setUpdateTick((t) => t + 1), 80)
  }, [setCakeShape])

  // 바탕색 변경 시 Konva 캔버스 재렌더 후 텍스처 갱신
  useEffect(() => {
    const timer = setTimeout(() => setUpdateTick((t) => t + 1), 50)
    return () => clearTimeout(timer)
  }, [baseColor])

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2">
          <span className="text-2xl">🎂</span>
          <h1 className="text-lg font-bold text-gray-800">케이크 도안 디자이너</h1>
        </div>
        <p className="text-xs text-gray-400">브러쉬로 그리고 3D 미리보기를 확인하세요</p>
      </header>

      {/* Main */}
      <div className="flex flex-1 min-h-0 overflow-hidden">
        {/* Left: Tools + Canvases (1.8) */}
        <div className="flex min-w-0 border-r border-gray-200 bg-white overflow-y-auto" style={{ flex: '1.8' }}>
          <div className="flex gap-0 flex-1">
            {/* Sidebar: Toolbar */}
            <div className="w-16 shrink-0 border-r border-gray-100 p-3 bg-gray-50 flex flex-col items-center">
              <Toolbar
                value={tool}
                onChange={setTool}
                color={color}
                onColorChange={setColor}
                size={size}
                onSizeChange={setSize}
                baseColor={baseColor}
                onBaseColorChange={setBaseColor}
                onUndo={() => drawingPanelRef.current?.undo()}
                canUndo={canUndo}
              />
            </div>

            {/* Drawing canvases */}
            <div className="flex-1 p-4 overflow-y-auto">
              <DrawingPanel
                ref={drawingPanelRef}
                tool={tool}
                color={color}
                size={size}
                cakeShape={cakeShape}
                baseColor={baseColor}
                topRef={topRef}
                sideRef={sideRef}
                onUndoChange={setCanUndo}
                onUpdate={handleUpdate}
              />
            </div>
          </div>
        </div>

        {/* Right: 3D preview (1.2) */}
        <div className="min-w-0 flex flex-col" style={{ flex: '1.2' }}>
          <div className="flex-1 p-4">
            <CakePreview3D
              topRef={topRef}
              sideRef={sideRef}
              cakeShape={cakeShape}
              updateTick={updateTick}
              canvasRef={threeCanvasRef}
              baseColor={baseColor}
            />
          </div>

          {/* Bottom controls for right panel */}
          <div className="border-t border-gray-200 p-4 bg-white shrink-0 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                케이크 모양
              </p>
              <CakeShapeSelector value={cakeShape} onChange={handleShapeChange} />
            </div>

            <button
              onClick={exportToPNG}
              className="flex items-center gap-2 px-5 py-2.5 bg-violet-600 hover:bg-violet-700 text-white font-semibold rounded-xl transition-colors shadow-sm"
            >
              <span>📥</span>
              <span>PNG 저장</span>
            </button>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 px-6 py-2 flex items-center justify-center gap-3 shrink-0">
        <span className="text-xs text-gray-500 font-medium">Seoyoon Park</span>
        <span className="text-gray-300">·</span>
        <a
          href="mailto:dev.yelee@gmail.com"
          className="text-xs text-violet-500 hover:text-violet-700 transition-colors"
        >
          dev.yelee@gmail.com
        </a>
      </footer>
    </div>
  )
}
