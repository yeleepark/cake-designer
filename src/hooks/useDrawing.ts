'use client'

import { useRef, useState } from 'react'
import type Konva from 'konva'
import type { Tool, CakeShape } from '@/types/cake'

export function useDrawing() {
  const [tool, setTool] = useState<Tool>('brush')
  const [brushColor, setBrushColor] = useState('#7c3aed')
  const [lineColor, setLineColor] = useState('#C44569')
  const [fillColor, setFillColor] = useState('#FF6B81')
  const [size, setSize] = useState(8)
  const [cakeShape, setCakeShape] = useState<CakeShape>('circle')
  const [baseColor, setBaseColor] = useState('#ffffff')

  const topRef = useRef<Konva.Stage>(null)
  const sideRef = useRef<Konva.Stage>(null)

  return {
    tool,
    setTool,
    brushColor,
    setBrushColor,
    lineColor,
    setLineColor,
    fillColor,
    setFillColor,
    size,
    setSize,
    cakeShape,
    setCakeShape,
    baseColor,
    setBaseColor,
    topRef,
    sideRef,
  }
}
