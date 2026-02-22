'use client'

import type { RefObject } from 'react'
import type Konva from 'konva'

export function useExport(
  topRef: RefObject<Konva.Stage | null>,
  sideRef: RefObject<Konva.Stage | null>,
  threeCanvasRef: RefObject<HTMLCanvasElement | null>
) {
  const exportToPNG = () => {
    const topStage = topRef.current
    const sideStage = sideRef.current
    if (!topStage || !sideStage) return

    const SCALE = 2
    const PAD = 24

    // 2D 캔버스 데이터
    const topDataUrl = topStage.toDataURL({ pixelRatio: SCALE })
    const sideDataUrl = sideStage.toDataURL({ pixelRatio: SCALE })
    const topW = topStage.width() * SCALE
    const topH = topStage.height() * SCALE
    const sideW = sideStage.width() * SCALE
    const sideH = sideStage.height() * SCALE

    // 3D 캔버스 데이터 (preserveDrawingBuffer: true 가 설정돼 있어야 캡처 가능)
    const threeCanvas = threeCanvasRef.current
    const threeDataUrl = threeCanvas ? threeCanvas.toDataURL('image/png') : null
    const threeW = threeCanvas ? threeCanvas.width : 0
    const threeH = threeCanvas ? threeCanvas.height : 0

    // 왼쪽 패널: 윗면 + 옆면 세로 스택
    const leftW = Math.max(topW, sideW)
    const leftH = topH + PAD + sideH

    // 전체 캔버스: 왼쪽(2D) + 오른쪽(3D)
    const totalW = leftW + (threeDataUrl ? threeW + PAD : 0) + PAD * 3
    const totalH = Math.max(leftH, threeH) + PAD * 2

    const canvas = document.createElement('canvas')
    canvas.width = totalW
    canvas.height = totalH
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, totalW, totalH)

    const topImg = new Image()
    const sideImg = new Image()
    const threeImg = threeDataUrl ? new Image() : null
    let total = threeImg ? 3 : 2
    let loaded = 0

    const download = () => {
      // 왼쪽: 윗면
      ctx.drawImage(topImg, PAD, PAD, topW, topH)
      // 왼쪽: 옆면 (윗면 아래)
      ctx.drawImage(sideImg, PAD, PAD + topH + PAD, sideW, sideH)
      // 오른쪽: 3D 렌더
      if (threeImg) {
        ctx.drawImage(threeImg, leftW + PAD * 2, PAD, threeW, threeH)
      }

      canvas.toBlob((blob) => {
        if (!blob) return
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = 'cake-design.png'
        a.click()
        URL.revokeObjectURL(url)
      })
    }

    const onLoad = () => {
      loaded++
      if (loaded === total) download()
    }

    topImg.onload = onLoad
    sideImg.onload = onLoad
    topImg.src = topDataUrl
    sideImg.src = sideDataUrl

    if (threeImg) {
      threeImg.onload = onLoad
      threeImg.src = threeDataUrl!
    }
  }

  return { exportToPNG }
}
