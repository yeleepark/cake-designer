'use client'

import { useState, useCallback, useRef, useEffect } from 'react'
import type { CakeShape } from '@/types/cake'
import dynamic from 'next/dynamic'
import { useDrawing } from '@/hooks/useDrawing'
import { useExport } from '@/hooks/useExport'
import AppBar from '@mui/material/AppBar'
import MuiToolbar from '@mui/material/Toolbar'
import Box from '@mui/material/Box'
import Tabs from '@mui/material/Tabs'
import Tab from '@mui/material/Tab'
import Button from '@mui/material/Button'
import Paper from '@mui/material/Paper'
import Typography from '@mui/material/Typography'
import Divider from '@mui/material/Divider'
import CakeIcon from '@mui/icons-material/Cake'
import EditIcon from '@mui/icons-material/Edit'
import DownloadIcon from '@mui/icons-material/Download'
import Toolbar from './Toolbar'
import CakeShapeSelector from './CakeShapeSelector'
import DrawingPanel, { type DrawingPanelHandle } from './DrawingPanel'

const CakePreview3D = dynamic(() => import('@/components/preview/CakePreview3D'), {
  ssr: false,
  loading: () => (
    <Box sx={{ width: '100%', height: '100%', minHeight: 400, display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: 'grey.50', borderRadius: 3 }}>
      <Typography variant="body2" color="text.disabled">3D 미리보기 로딩 중...</Typography>
    </Box>
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
  const [mobileTab, setMobileTab] = useState(0) // 0=design, 1=cake
  const scrollRef = useRef<HTMLDivElement>(null)
  const [scrollFade, setScrollFade] = useState({ left: false, right: true })

  const updateScrollFade = useCallback(() => {
    const el = scrollRef.current
    if (!el) return
    setScrollFade({
      left: el.scrollLeft > 4,
      right: el.scrollLeft < el.scrollWidth - el.clientWidth - 4,
    })
  }, [])

  useEffect(() => {
    const el = scrollRef.current
    if (!el) return
    updateScrollFade()
    el.addEventListener('scroll', updateScrollFade, { passive: true })
    return () => el.removeEventListener('scroll', updateScrollFade)
  }, [updateScrollFade, mobileTab])

  const handleMobileTab = useCallback((_: React.SyntheticEvent, tab: number) => {
    setMobileTab(tab)
    if (tab === 1) {
      setTimeout(() => setUpdateTick((t) => t + 1), 50)
    }
  }, [])

  const handleUpdate = useCallback(() => {
    setUpdateTick((t) => t + 1)
  }, [])

  const handleShapeChange = useCallback((shape: CakeShape) => {
    setCakeShape(shape)
    setTimeout(() => setUpdateTick((t) => t + 1), 80)
  }, [setCakeShape])

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

  const isDesign = mobileTab === 0

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100vh', bgcolor: 'background.default' }}>
      {/* Header */}
      <AppBar position="static" color="inherit" elevation={0} sx={{ borderBottom: 1, borderColor: 'divider', bgcolor: 'background.default' }} className="landscape-header">
        <MuiToolbar variant="dense" sx={{ justifyContent: 'space-between', px: { xs: 2, md: 3 } }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <CakeIcon sx={{ fontSize: 28, color: 'primary.main' }} />
            <Typography variant="subtitle1" fontWeight={700} color="text.primary" sx={{ letterSpacing: 0.5 }}>
              케이크 도안 디자이너
            </Typography>
          </Box>
          <Typography variant="caption" color="text.disabled" sx={{ display: { xs: 'none', md: 'block' }, fontStyle: 'italic' }}>
            브러쉬로 그리고 3D 미리보기를 확인하세요
          </Typography>
        </MuiToolbar>
      </AppBar>

      {/* 탭 바 (모바일 전용) */}
      <Box sx={{ display: { xs: 'block', md: 'none' }, flexShrink: 0 }} className="landscape-hide">
        <Tabs
          value={mobileTab}
          onChange={handleMobileTab}
          variant="fullWidth"
          textColor="primary"
          indicatorColor="primary"
          sx={{ bgcolor: 'background.paper', borderBottom: 1, borderColor: 'divider', '& .MuiTab-root': { textTransform: 'none' } }}
        >
          <Tab icon={<EditIcon sx={{ fontSize: 18 }} />} iconPosition="start" label="시안" sx={{ fontWeight: 600, fontSize: '0.875rem', minHeight: 48 }} />
          <Tab icon={<CakeIcon sx={{ fontSize: 18 }} />} iconPosition="start" label="케이크" sx={{ fontWeight: 600, fontSize: '0.875rem', minHeight: 48 }} />
        </Tabs>
      </Box>

      {/* 메인 콘텐츠 */}
      <Box sx={{ flex: 1, minHeight: 0, overflow: 'hidden', position: 'relative', display: { md: 'flex' } }}>

        {/* ── 시안 패널 ── */}
        <Box
          sx={{
            bgcolor: 'background.paper',
            position: { xs: 'absolute', md: 'relative' },
            inset: { xs: 0, md: 'auto' },
            width: { md: '60%' },
            minWidth: { md: 0 },
            display: { md: 'flex' },
            flexDirection: { md: 'column' },
            minHeight: { md: 0 },
            borderRight: { md: 1 },
            borderColor: { md: 'divider' },
            visibility: { xs: isDesign ? 'visible' : 'hidden', md: 'visible' },
            pointerEvents: { xs: isDesign ? 'auto' : 'none', md: 'auto' },
            overflow: { xs: isDesign ? 'auto' : 'visible', md: 'visible' },
          }}
          className={isDesign ? 'mobile-safe-bottom' : undefined}
        >
          <Box sx={{ display: 'flex', flex: { md: 1 }, minHeight: { md: 0 } }}>
            {/* 세로 툴바 (데스크탑 전용) */}
            <Box sx={{ display: { xs: 'none', md: 'flex' }, width: 64, flexShrink: 0, borderRight: 1, borderColor: 'divider', p: 1.5, bgcolor: 'grey.50', flexDirection: 'column', alignItems: 'center' }}>
              <Toolbar {...toolbarProps} />
            </Box>
            <Box sx={{ flex: 1, p: 2, overflow: { md: 'auto' } }}>
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
            </Box>
          </Box>
        </Box>

        {/* ── 3D 미리보기 패널 ── */}
        <Box
          sx={{
            position: { xs: 'absolute', md: 'relative' },
            inset: { xs: 0, md: 'auto' },
            width: { md: '40%' },
            minWidth: { md: 0 },
            display: { xs: !isDesign ? 'flex' : 'block', md: 'flex' },
            flexDirection: { xs: 'column', md: 'column' },
            minHeight: { md: 0 },
            visibility: { xs: !isDesign ? 'visible' : 'hidden', md: 'visible' },
            pointerEvents: { xs: !isDesign ? 'auto' : 'none', md: 'auto' },
            bgcolor: { xs: !isDesign ? 'background.paper' : 'transparent', md: 'background.paper' },
          }}
        >
          <Box sx={{ flex: 1, minHeight: 0, p: 2 }}>
            <CakePreview3D
              topRef={topRef}
              sideRef={sideRef}
              cakeShape={cakeShape}
              updateTick={updateTick}
              canvasRef={threeCanvasRef}
              baseColor={baseColor}
            />
          </Box>
          <Box sx={{ display: { xs: 'none', md: 'flex' }, alignItems: 'center', justifyContent: 'space-between', borderTop: 1, borderColor: 'divider', p: 2, bgcolor: 'background.paper', flexShrink: 0 }}>
            <Box>
              <Typography variant="caption" sx={{ fontWeight: 600, color: 'text.secondary', textTransform: 'uppercase', letterSpacing: 1, mb: 1, display: 'block' }}>
                케이크 모양
              </Typography>
              <CakeShapeSelector value={cakeShape} onChange={handleShapeChange} />
            </Box>
            <Button
              variant="outlined"
              onClick={exportToPNG}
              startIcon={<DownloadIcon />}
              sx={{ borderRadius: 6, px: 3, fontWeight: 600, textTransform: 'none' }}
            >
              PNG 저장
            </Button>
          </Box>
        </Box>
      </Box>

      {/* 하단 고정 바 (모바일 전용) */}
      <Paper
        elevation={0}
        square
        sx={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          zIndex: 50,
          display: { xs: 'flex', md: 'none' },
          alignItems: 'center',
          borderTop: 1,
          borderColor: 'divider',
          pb: 'env(safe-area-inset-bottom, 0px)',
          height: 'calc(4rem + env(safe-area-inset-bottom, 0px))',
        }}
        className="landscape-compact-bar"
      >
        {/* 좌측 그라디언트 */}
        {scrollFade.left && (
          <Box sx={{ position: 'absolute', left: 0, top: 0, height: 64, width: 24, zIndex: 10, pointerEvents: 'none', background: 'linear-gradient(to right, #faf8f5, transparent)' }} />
        )}
        <Box ref={scrollRef} sx={{ display: 'flex', alignItems: 'center', gap: 1, overflowX: 'auto', px: 1.5, width: '100%', height: 64, scrollbarWidth: 'none' }}>
          {isDesign && (
            <>
              <Toolbar {...toolbarProps} horizontal />
              <Divider orientation="vertical" flexItem sx={{ height: 32, alignSelf: 'center' }} />
            </>
          )}
          <CakeShapeSelector value={cakeShape} onChange={handleShapeChange} compact />
          <Divider orientation="vertical" flexItem sx={{ height: 32, alignSelf: 'center' }} />
          <Button
            variant="outlined"
            size="small"
            onClick={exportToPNG}
            startIcon={<DownloadIcon />}
            sx={{ flexShrink: 0, borderRadius: 6, fontWeight: 600, textTransform: 'none', whiteSpace: 'nowrap' }}
          >
            저장
          </Button>
        </Box>
        {/* 우측 그라디언트 */}
        {scrollFade.right && (
          <Box sx={{ position: 'absolute', right: 0, top: 0, height: 64, width: 24, zIndex: 10, pointerEvents: 'none', background: 'linear-gradient(to left, #faf8f5, transparent)' }} />
        )}
      </Paper>

      {/* Footer (데스크탑 전용) */}
      <Box
        component="footer"
        sx={{ display: { xs: 'none', md: 'flex' }, bgcolor: 'background.default', borderTop: 1, borderColor: 'divider', px: 3, py: 1.5, alignItems: 'center', justifyContent: 'center', gap: 1.5, flexShrink: 0 }}
      >
        <Typography variant="caption" color="text.secondary" fontWeight={500}>Seoyoon Park</Typography>
        <Typography color="text.disabled">·</Typography>
        <Typography
          component="a"
          href="mailto:dev.yelee@gmail.com"
          variant="caption"
          sx={{ color: 'primary.main', '&:hover': { color: 'primary.dark' }, transition: 'color 0.2s', textDecoration: 'none' }}
        >
          dev.yelee@gmail.com
        </Typography>
      </Box>
    </Box>
  )
}
