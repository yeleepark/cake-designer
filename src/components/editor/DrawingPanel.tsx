'use client'

import type Konva from 'konva'
import type { Tool, CakeShape } from '@/types/cake'
import TopFaceCanvas from './TopFaceCanvas'
import SideFaceCanvas from './SideFaceCanvas'

interface Props {
  tool: Tool
  color: string
  size: number
  cakeShape: CakeShape
  baseColor: string
  topRef: React.RefObject<Konva.Stage | null>
  sideRef: React.RefObject<Konva.Stage | null>
  onUpdate?: () => void
}

export default function DrawingPanel({
  tool,
  color,
  size,
  cakeShape,
  baseColor,
  topRef,
  sideRef,
  onUpdate,
}: Props) {
  return (
    <div className="flex flex-col gap-6">
      <TopFaceCanvas
        stageRef={topRef}
        tool={tool}
        color={color}
        size={size}
        cakeShape={cakeShape}
        baseColor={baseColor}
        onUpdate={onUpdate}
      />
      <SideFaceCanvas
        stageRef={sideRef}
        tool={tool}
        color={color}
        size={size}
        cakeShape={cakeShape}
        baseColor={baseColor}
        onUpdate={onUpdate}
      />
    </div>
  )
}
