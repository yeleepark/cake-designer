'use client'

import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import Slider from '@mui/material/Slider'

interface Props {
  color: string
  size: number
  onColorChange: (color: string) => void
  onSizeChange: (size: number) => void
}

const PRESET_COLORS = [
  '#000000', '#ffffff', '#ef4444', '#f97316', '#eab308',
  '#22c55e', '#3b82f6', '#8b5cf6', '#ec4899', '#06b6d4',
  '#a16207', '#be185d', '#7c3aed', '#0f766e', '#1d4ed8',
  '#fbbf24', '#f9a8d4', '#a7f3d0', '#bfdbfe', '#ddd6fe',
]

export default function ColorPalette({ color, size, onColorChange, onSizeChange }: Props) {
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
      <Box>
        <Typography variant="caption" sx={{ fontWeight: 600, color: 'text.secondary', textTransform: 'uppercase', letterSpacing: 1, mb: 1, display: 'block' }}>
          색상
        </Typography>
        <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 0.75 }}>
          {PRESET_COLORS.map((c) => (
            <Box
              key={c}
              component="button"
              onClick={() => onColorChange(c)}
              title={c}
              sx={{
                width: 28,
                height: 28,
                borderRadius: 1,
                border: 2,
                borderColor: color === c ? 'primary.main' : 'grey.300',
                transform: color === c ? 'scale(1.1)' : 'none',
                transition: 'transform 0.15s',
                backgroundColor: c,
                cursor: 'pointer',
                p: 0,
                '&:hover': { transform: 'scale(1.1)' },
              }}
            />
          ))}
        </Box>
        <Box sx={{ mt: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
          <Typography variant="caption" color="text.secondary">직접 입력:</Typography>
          <Box
            component="input"
            type="color"
            value={color}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => onColorChange(e.target.value)}
            sx={{ width: 32, height: 32, borderRadius: 1, cursor: 'pointer', border: 1, borderColor: 'grey.300' }}
          />
          <Typography variant="caption" sx={{ fontFamily: 'monospace', color: 'text.secondary' }}>{color}</Typography>
        </Box>
      </Box>

      <Box>
        <Typography variant="caption" sx={{ fontWeight: 600, color: 'text.secondary', textTransform: 'uppercase', letterSpacing: 1, mb: 1, display: 'block' }}>
          굵기: {size}px
        </Typography>
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
    </Box>
  )
}
