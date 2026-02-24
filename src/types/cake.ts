export type Tool = 'brush' | 'eraser' | 'fill' | 'line'

export type CakeShape = 'circle' | 'square'

export interface DrawingState {
  tool: Tool
  color: string
  size: number
  cakeShape: CakeShape
}

export interface LineData {
  id: string
  points: number[]
  stroke: string
  strokeWidth: number
  globalCompositeOperation: 'source-over' | 'destination-out'
}

export interface FillSnapshot {
  id: string
  imageEl: HTMLImageElement
}
