'use client'

import { useRef, useState } from 'react'
import type Konva from 'konva'
import type { Tool, CakeShape } from '@/types/cake'

export function useDrawing() {
  const [tool, setTool] = useState<Tool>('brush')
  const [color, setColor] = useState('#7c3aed')
  const [size, setSize] = useState(8)
  const [cakeShape, setCakeShape] = useState<CakeShape>('circle')
  const [baseColor, setBaseColor] = useState('#ffffff')

  const topRef = useRef<Konva.Stage>(null)
  const sideRef = useRef<Konva.Stage>(null)

  return {
    tool,
    setTool,
    color,
    setColor,
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
