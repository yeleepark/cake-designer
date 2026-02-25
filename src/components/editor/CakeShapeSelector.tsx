'use client'

import type { CakeShape } from '@/types/cake'
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup'
import ToggleButton from '@mui/material/ToggleButton'
import CircleIcon from '@mui/icons-material/Circle'
import CropSquareIcon from '@mui/icons-material/CropSquare'

interface Props {
  value: CakeShape
  onChange: (shape: CakeShape) => void
  compact?: boolean
}

const SHAPES: { value: CakeShape; label: string; icon: React.ReactNode }[] = [
  { value: 'circle', label: '원형', icon: <CircleIcon sx={{ fontSize: 20 }} /> },
  { value: 'square', label: '사각형', icon: <CropSquareIcon sx={{ fontSize: 20 }} /> },
]

export default function CakeShapeSelector({ value, onChange, compact = false }: Props) {
  return (
    <ToggleButtonGroup
      exclusive
      value={value}
      onChange={(_, v) => v && onChange(v)}
      size="small"
      sx={{
        gap: 1,
        '& .MuiToggleButton-root': {
          borderRadius: '12px !important',
          border: '2px solid',
          borderColor: 'grey.300',
          textTransform: 'none',
          fontWeight: 500,
          gap: 0.5,
          width: compact ? 48 : 80,
          height: compact ? 48 : 64,
          flexDirection: compact ? 'row' : 'column',
          fontSize: '0.875rem',
          '&.Mui-selected': {
            borderColor: 'primary.main',
            bgcolor: 'primary.50',
            color: 'primary.dark',
            '&:hover': { bgcolor: 'primary.50' },
          },
          '&:not(.Mui-selected):hover': {
            borderColor: 'grey.400',
          },
        },
      }}
    >
      {SHAPES.map((shape) => (
        <ToggleButton key={shape.value} value={shape.value} title={shape.label}>
          {shape.icon}
          {!compact && <span>{shape.label}</span>}
        </ToggleButton>
      ))}
    </ToggleButtonGroup>
  )
}
