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
  const { tool, setTool, brushColor, setBrushColor, lineColor, setLineColor, fillColor, setFillColor, size, setSize, cakeShape, setCakeShape, baseColor, setBaseColor, stampColor, setStampColor, stampType, setStampType, stampSize, setStampSize, topRef, sideRef } =
    useDrawing()
  const threeCanvasRef = useRef<HTMLCanvasElement | null>(null)
  const { exportToPNG } = useExport(topRef, sideRef, threeCanvasRef)
  const [updateTick, setUpdateTick] = useState(0)
  const drawingPanelRef = useRef<DrawingPanelHandle>(null)
  const [canUndo, setCanUndo] = useState(false)
  const [mobileTab, setMobileTab] = useState<'design' | 'cake'>('design')

  const handleMobileTab = useCallback((tab: 'design' | 'cake') => {
    setMobileTab(tab)
    if (tab === 'cake') {
      setTimeout(() => setUpdateTick((t) => t + 1), 50)
    }
  }, [])

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

  const toolbarProps = {
    value: tool,
    onChange: setTool,
    brushColor,
    onBrushColorChange: setBrushColor,
    lineColor,
    onLineColorChange: setLineColor,
    fillColor,
    onFillColorChange: setFillColor,
    size,
    onSizeChange: setSize,
    baseColor,
    onBaseColorChange: setBaseColor,
    stampColor,
    onStampColorChange: setStampColor,
    stampType,
    onStampTypeChange: setStampType,
    stampSize,
    onStampSizeChange: setStampSize,
    onUndo: () => drawingPanelRef.current?.undo(),
    canUndo,
  }

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-4 md:px-6 py-3 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2">
          <span className="text-2xl">🎂</span>
          <h1 className="text-base md:text-lg font-bold text-gray-800">케이크 도안 디자이너</h1>
        </div>
        <p className="hidden md:block text-xs text-gray-400">브러쉬로 그리고 3D 미리보기를 확인하세요</p>
      </header>

      {/* 탭 바 (모바일 전용) */}
      <div className="flex md:hidden shrink-0 bg-white border-b border-gray-200">
        {[
          { id: 'design', label: '시안', icon: '✏️' },
          { id: 'cake',   label: '케이크', icon: '🎂' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => handleMobileTab(tab.id as 'design' | 'cake')}
            className={`flex-1 flex items-center justify-center gap-1.5 py-3 text-sm font-semibold transition-colors border-b-2 ${
              mobileTab === tab.id
                ? 'border-violet-500 text-violet-600'
                : 'border-transparent text-gray-400'
            }`}
          >
            <span>{tab.icon}</span>
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* 메인 콘텐츠 — 단일 레이아웃 구조 */}
      <div className="flex-1 min-h-0 overflow-hidden relative md:flex">

        {/* ── 시안 패널 (DrawingPanel 단일 인스턴스) ── */}
        {/* 데스크탑: flex 컬럼으로 항상 표시 / 모바일: design 탭일 때만 표시 */}
        <div
          className={`bg-white md:relative md:flex md:flex-col md:min-h-0 md:border-r md:border-gray-200 md:visible md:pointer-events-auto ${
            mobileTab === 'design'
              ? 'absolute inset-0 overflow-y-auto pb-16'
              : 'absolute inset-0 invisible pointer-events-none'
          }`}
          style={{ flex: '1.8' }}
        >
          {/* 내부: 세로 툴바(데스크탑 전용) + 캔버스 */}
          <div className="flex gap-0 md:flex-1 md:min-h-0">
            <div className="hidden md:flex w-16 shrink-0 border-r border-gray-100 p-3 bg-gray-50 flex-col items-center">
              <Toolbar {...toolbarProps} />
            </div>
            <div className="flex-1 p-4 md:overflow-y-auto">
              <DrawingPanel
                ref={drawingPanelRef}
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
                topRef={topRef}
                sideRef={sideRef}
                onUndoChange={setCanUndo}
                onUpdate={handleUpdate}
              />
            </div>
          </div>
        </div>

        {/* ── 3D 미리보기 패널 ── */}
        {/* 데스크탑: flex 컬럼으로 항상 표시 / 모바일: cake 탭일 때만 표시 */}
        <div
          className={`md:relative md:flex md:flex-col md:min-h-0 md:visible md:pointer-events-auto ${
            mobileTab === 'cake'
              ? 'absolute inset-0 flex flex-col bg-gray-50'
              : 'absolute inset-0 invisible pointer-events-none'
          }`}
          style={{ flex: '1.2' }}
        >
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
          <div className="border-t border-gray-200 p-4 bg-white shrink-0 hidden md:flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">케이크 모양</p>
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

      {/* 하단 고정 바 (모바일 전용) */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50 shadow-lg h-16 flex items-center md:hidden">
        <div className="flex items-center gap-2 overflow-x-auto px-3 w-full" style={{ scrollbarWidth: 'none' }}>
          {mobileTab === 'design' && (
            <>
              <Toolbar {...toolbarProps} horizontal />
              <div className="h-8 w-px bg-gray-200 shrink-0" />
            </>
          )}
          <CakeShapeSelector value={cakeShape} onChange={handleShapeChange} compact />
          <div className="h-8 w-px bg-gray-200 shrink-0" />
          <button
            onClick={exportToPNG}
            className="shrink-0 flex items-center gap-1.5 px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white font-semibold rounded-xl transition-colors shadow-sm text-sm"
          >
            <span>📥</span>
            <span>저장</span>
          </button>
        </div>
      </div>

      {/* Footer (데스크탑 전용) */}
      <footer className="hidden md:flex bg-white border-t border-gray-200 px-6 py-2 items-center justify-center gap-3 shrink-0">
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
