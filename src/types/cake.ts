export type Tool = 'brush' | 'eraser' | 'fill' | 'line' | 'stamp'

export type CakeShape = 'circle' | 'square' | 'heart'

export type StampType = 'heart' | 'star' | 'confetti'

export interface StampData {
  id: string
  type: StampType
  x: number
  y: number
  size: number
  color: string
}

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
