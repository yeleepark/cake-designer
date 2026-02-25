'use client'

import { useState, useRef } from 'react'
import Box from '@mui/material/Box'
import IconButton from '@mui/material/IconButton'
import Popover from '@mui/material/Popover'
import Slider from '@mui/material/Slider'
import Divider from '@mui/material/Divider'
import Typography from '@mui/material/Typography'
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup'
import ToggleButton from '@mui/material/ToggleButton'
import CloseIcon from '@mui/icons-material/Close'
import BrushIcon from '@mui/icons-material/Brush'
import AutoFixNormalIcon from '@mui/icons-material/AutoFixNormal'
import FormatColorFillIcon from '@mui/icons-material/FormatColorFill'
import FormatPaintIcon from '@mui/icons-material/FormatPaint'
import UndoIcon from '@mui/icons-material/Undo'
import HorizontalRuleIcon from '@mui/icons-material/HorizontalRule'
import StarsIcon from '@mui/icons-material/Stars'
import FavoriteIcon from '@mui/icons-material/Favorite'
import StarIcon from '@mui/icons-material/Star'
import CelebrationIcon from '@mui/icons-material/Celebration'
import type { Tool, StampType } from '@/types/cake'

interface Props {
  value: Tool
  onChange: (tool: Tool) => void
  brushColor: string
  onBrushColorChange: (color: string) => void
  lineColor: string
  onLineColorChange: (color: string) => void
  fillColor: string
  onFillColorChange: (color: string) => void
  size: number
  onSizeChange: (size: number) => void
  baseColor: string
  onBaseColorChange: (color: string) => void
  stampColor: string
  onStampColorChange: (color: string) => void
  stampType: StampType
  onStampTypeChange: (type: StampType) => void
  stampSize: number
  onStampSizeChange: (size: number) => void
  onUndo?: () => void
  canUndo?: boolean
  horizontal?: boolean
}

const PRESET_COLORS = [
  '#F8C8DC', '#FFAEBE', '#EDACB1', '#FFF3E8', '#C97A8D',
  '#FF6B81', '#FF9AA2', '#FFD3B6', '#FFF5F0', '#C44569',
  '#A3B18A', '#588157', '#DAD7CD', '#FFF1E6', '#6B705C',
  '#A0C4FF', '#BDB2FF', '#FFC6FF', '#FDFFB6', '#6C63FF',
]

const TOOLS: { value: Tool; icon: React.ReactNode; title: string }[] = [
  { value: 'brush', icon: <BrushIcon fontSize="small" />, title: '브러쉬' },
  { value: 'line', icon: <HorizontalRuleIcon fontSize="small" />, title: '직선' },
  { value: 'eraser', icon: <AutoFixNormalIcon fontSize="small" />, title: '지우개' },
  { value: 'fill', icon: <FormatColorFillIcon fontSize="small" />, title: '채우기' },
  { value: 'stamp', icon: <StarsIcon fontSize="small" />, title: '스탬프' },
]

const STAMP_TYPES: { value: StampType; label: React.ReactNode }[] = [
  { value: 'heart', label: <FavoriteIcon sx={{ fontSize: 20 }} /> },
  { value: 'star', label: <StarIcon sx={{ fontSize: 20 }} /> },
  { value: 'confetti', label: <CelebrationIcon sx={{ fontSize: 20 }} /> },
]

/* ── 컬러 스와치 그리드 ── */
function ColorSwatch({
  selected,
  onChange,
}: {
  selected: string
  onChange: (color: string) => void
}) {
  return (
    <>
      <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 0.75, mb: 1 }}>
        {PRESET_COLORS.map((c) => (
          <Box
            key={c}
            component="button"
            onClick={() => onChange(c)}
            sx={{
              width: 32,
              height: 32,
              borderRadius: 1,
              border: 2,
              borderColor: selected === c ? 'primary.main' : 'grey.200',
              transform: selected === c ? 'scale(1.1)' : 'none',
              transition: 'transform 0.15s',
              backgroundColor: c,
              cursor: 'pointer',
              p: 0,
              '&:hover': { transform: 'scale(1.1)' },
            }}
          />
        ))}
      </Box>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
        <Box
          component="input"
          type="color"
          value={selected}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => onChange(e.target.value)}
          sx={{ width: 32, height: 32, borderRadius: 1, cursor: 'pointer', border: 1, borderColor: 'grey.300', p: 0.25 }}
        />
        <Typography variant="caption" sx={{ fontFamily: 'monospace', color: 'text.secondary' }}>
          {selected}
        </Typography>
      </Box>
    </>
  )
}

export default function Toolbar({
  value,
  onChange,
  brushColor,
  onBrushColorChange,
  lineColor,
  onLineColorChange,
  fillColor,
  onFillColorChange,
  size,
  onSizeChange,
  baseColor,
  onBaseColorChange,
  stampColor,
  onStampColorChange,
  stampType,
  onStampTypeChange,
  stampSize,
  onStampSizeChange,
  onUndo,
  canUndo,
  horizontal = false,
}: Props) {
  const [popupAnchor, setPopupAnchor] = useState<HTMLElement | null>(null)
  const [baseColorAnchor, setBaseColorAnchor] = useState<HTMLElement | null>(null)
  const anchorRef = useRef<HTMLButtonElement>(null)
  const baseColorAnchorRef = useRef<HTMLButtonElement>(null)

  const vibrate = (ms = 10) => {
    try { navigator?.vibrate?.(ms) } catch {}
  }

  const hasPopup = (t: Tool) => t === 'brush' || t === 'eraser' || t === 'line' || t === 'fill' || t === 'stamp'

  const handleToolClick = (tool: Tool, el: HTMLElement) => {
    vibrate()
    if (hasPopup(tool) && value === tool) {
      setPopupAnchor((prev) => prev ? null : el)
    } else {
      onChange(tool)
      setPopupAnchor(hasPopup(tool) ? el : null)
    }
  }

  const showPopup = Boolean(popupAnchor) && hasPopup(value)

  const toolBtnSx = (active: boolean) => ({
    width: horizontal ? 48 : 40,
    height: horizontal ? 48 : 40,
    borderRadius: 1.5,
    border: 1,
    borderColor: active ? 'primary.main' : 'grey.200',
    bgcolor: active ? 'action.selected' : 'background.paper',
    color: active ? 'primary.main' : 'text.secondary',
    transition: 'all 0.2s ease',
    '&:hover': { bgcolor: active ? 'action.selected' : 'grey.100', borderColor: active ? 'primary.main' : 'grey.300', color: active ? 'primary.main' : 'text.primary' },
  })

  const colorDot = (color: string) => (
    <Box
      sx={{
        position: 'absolute',
        bottom: 4,
        right: 4,
        width: 8,
        height: 8,
        borderRadius: '50%',
        border: '1px solid white',
        bgcolor: color,
      }}
    />
  )

  const popupTitle =
    value === 'brush' ? '브러쉬 설정' :
    value === 'line' ? '직선 설정' :
    value === 'fill' ? '채우기 색상' :
    value === 'stamp' ? '스탬프 설정' :
    '지우개 크기'

  return (
    <Box sx={{ position: 'relative', display: 'flex', flexDirection: horizontal ? 'row' : 'column', alignItems: 'center', gap: 0.5 }}>
      {/* 라벨: 세로 모드에서만 */}
      {!horizontal && (
        <Typography variant="caption" sx={{ fontWeight: 600, color: 'text.secondary', textTransform: 'uppercase', letterSpacing: 1, mb: 0.5 }}>
          도구
        </Typography>
      )}

      {TOOLS.map((tool) => {
        const isActive = value === tool.value
        return (
          <IconButton
            key={tool.value}
            ref={isActive && hasPopup(tool.value) ? anchorRef : undefined}
            title={tool.title}
            onClick={(e) => handleToolClick(tool.value, e.currentTarget)}
            sx={toolBtnSx(isActive)}
          >
            {tool.icon}
            {tool.value === 'brush' && colorDot(brushColor)}
            {tool.value === 'line' && colorDot(lineColor)}
            {tool.value === 'fill' && colorDot(fillColor)}
            {tool.value === 'stamp' && colorDot(stampColor)}
          </IconButton>
        )
      })}

      <Divider orientation={horizontal ? 'vertical' : 'horizontal'} flexItem sx={horizontal ? { mx: 0.5, height: 32, alignSelf: 'center' } : { my: 1 }} />

      {/* 바탕색 라벨: 세로 모드에서만 */}
      {!horizontal && (
        <Typography variant="caption" sx={{ fontWeight: 600, color: 'text.secondary', textTransform: 'uppercase', letterSpacing: 1, mb: 0.5 }}>
          바탕
        </Typography>
      )}

      {/* 바탕색 버튼 */}
      <IconButton
        ref={baseColorAnchorRef}
        title="바탕 색상"
        onClick={(e) => setBaseColorAnchor((prev) => prev ? null : e.currentTarget)}
        sx={toolBtnSx(Boolean(baseColorAnchor))}
      >
        <FormatPaintIcon fontSize="small" />
        {colorDot(baseColor)}
      </IconButton>

      <Divider orientation={horizontal ? 'vertical' : 'horizontal'} flexItem sx={horizontal ? { mx: 0.5, height: 32, alignSelf: 'center' } : { my: 1 }} />

      {/* Undo 버튼 */}
      <IconButton
        title="실행 취소 (Undo)"
        onClick={onUndo}
        disabled={!canUndo}
        sx={{
          width: horizontal ? 48 : 40,
          height: horizontal ? 48 : 40,
          borderRadius: 3,
        }}
      >
        <UndoIcon fontSize="small" />
      </IconButton>

      {/* 바탕색 팝업 */}
      <Popover
        open={Boolean(baseColorAnchor)}
        anchorEl={baseColorAnchor}
        onClose={() => setBaseColorAnchor(null)}
        anchorOrigin={{ vertical: horizontal ? 'top' : 'center', horizontal: horizontal ? 'center' : 'right' }}
        transformOrigin={{ vertical: horizontal ? 'bottom' : 'center', horizontal: horizontal ? 'center' : 'left' }}
        slotProps={{ paper: { sx: { p: 2.5, width: 224, borderRadius: 2, border: 1, borderColor: 'divider' } } }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1.5 }}>
          <Typography variant="subtitle2">바탕 색상</Typography>
          <IconButton size="small" onClick={() => setBaseColorAnchor(null)}>
            <CloseIcon fontSize="small" />
          </IconButton>
        </Box>
        <ColorSwatch selected={baseColor} onChange={onBaseColorChange} />
      </Popover>

      {/* 브러쉬/지우개/직선/채우기/스탬프 팝업 */}
      <Popover
        open={showPopup}
        anchorEl={popupAnchor}
        onClose={() => setPopupAnchor(null)}
        anchorOrigin={{ vertical: horizontal ? 'top' : 'center', horizontal: horizontal ? 'center' : 'right' }}
        transformOrigin={{ vertical: horizontal ? 'bottom' : 'center', horizontal: horizontal ? 'center' : 'left' }}
        slotProps={{ paper: { sx: { p: 2.5, width: 224, borderRadius: 2, border: 1, borderColor: 'divider' } } }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1.5 }}>
          <Typography variant="subtitle2">{popupTitle}</Typography>
          <IconButton size="small" onClick={() => setPopupAnchor(null)}>
            <CloseIcon fontSize="small" />
          </IconButton>
        </Box>

        {/* 브러쉬 색상 */}
        {value === 'brush' && (
          <Box sx={{ mb: 2 }}>
            <Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: 'block' }}>색상</Typography>
            <ColorSwatch selected={brushColor} onChange={onBrushColorChange} />
          </Box>
        )}

        {/* 직선 색상 */}
        {value === 'line' && (
          <Box sx={{ mb: 2 }}>
            <Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: 'block' }}>색상</Typography>
            <ColorSwatch selected={lineColor} onChange={onLineColorChange} />
          </Box>
        )}

        {/* 채우기 색상 */}
        {value === 'fill' && (
          <Box>
            <Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: 'block' }}>색상</Typography>
            <ColorSwatch selected={fillColor} onChange={onFillColorChange} />
          </Box>
        )}

        {/* 스탬프 설정 */}
        {value === 'stamp' && (
          <Box>
            <Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: 'block' }}>모양</Typography>
            <ToggleButtonGroup
              exclusive
              value={stampType}
              onChange={(_, v) => v && onStampTypeChange(v)}
              sx={{ mb: 2 }}
            >
              {STAMP_TYPES.map((s) => (
                <ToggleButton key={s.value} value={s.value} sx={{ width: 40, height: 40 }}>
                  {s.label}
                </ToggleButton>
              ))}
            </ToggleButtonGroup>

            <Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: 'block' }}>색상</Typography>
            <ColorSwatch selected={stampColor} onChange={onStampColorChange} />

            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 2, mb: 1 }}>
              <Typography variant="caption" color="text.secondary">크기</Typography>
              <Typography variant="caption" sx={{ fontWeight: 600, color: 'primary.main' }}>{stampSize}px</Typography>
            </Box>
            <Slider
              value={stampSize}
              onChange={(_, v) => onStampSizeChange(v as number)}
              min={12}
              max={60}
              size="small"
            />
            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
              <Typography variant="caption" color="text.disabled">12</Typography>
              <Typography variant="caption" color="text.disabled">60</Typography>
            </Box>
          </Box>
        )}

        {/* 브러쉬/직선/지우개 크기 */}
        {(value === 'brush' || value === 'line' || value === 'eraser') && (
          <Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
              <Typography variant="caption" color="text.secondary">크기</Typography>
              <Typography variant="caption" sx={{ fontWeight: 600, color: 'primary.main' }}>{size}px</Typography>
            </Box>
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 68, bgcolor: 'grey.50', borderRadius: 3, mb: 1 }}>
              <Box
                sx={{
                  width: size,
                  height: size,
                  borderRadius: '50%',
                  bgcolor: value === 'brush' ? brushColor : value === 'line' ? lineColor : 'grey.500',
                }}
              />
            </Box>
            <Slider
              value={size}
              onChange={(_, v) => onSizeChange(v as number)}
              min={1}
              max={60}
              size="small"
            />
            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
              <Typography variant="caption" color="text.disabled">1</Typography>
              <Typography variant="caption" color="text.disabled">60</Typography>
            </Box>
          </Box>
        )}
      </Popover>
    </Box>
  )
}
