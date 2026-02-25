'use client'

import { useRef, useEffect, useState, type RefObject } from 'react'
import { Canvas, useThree } from '@react-three/fiber'
import { OrbitControls, Environment } from '@react-three/drei'
import * as THREE from 'three'
import type Konva from 'konva'
import type { CakeShape } from '@/types/cake'
import { useDeviceType } from '@/hooks/useDeviceType'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import Fade from '@mui/material/Fade'

const TOP_CANVAS_SIZE = 300
const TOP_RADIUS = 130
const CROP_SIZE = TOP_RADIUS * 2                        // 260
const CROP_OFFSET = (TOP_CANVAS_SIZE - CROP_SIZE) / 2  // 20
const TEX_SCALE = 3                                     // 텍스처 업스케일 배율
const PLATE_COLOR = '#f2e8d8'

function cropTopCanvas(src: HTMLCanvasElement, bgColor: string): HTMLCanvasElement {
  const outW = CROP_SIZE * TEX_SCALE
  const outH = CROP_SIZE * TEX_SCALE
  const out = document.createElement('canvas')
  out.width = outW
  out.height = outH
  const ctx = out.getContext('2d')!
  ctx.imageSmoothingEnabled = true
  ctx.imageSmoothingQuality = 'high'
  ctx.fillStyle = bgColor
  ctx.fillRect(0, 0, outW, outH)
  ctx.drawImage(src, CROP_OFFSET, CROP_OFFSET, CROP_SIZE, CROP_SIZE, 0, 0, outW, outH)
  return out
}

function transposeSideCanvas(src: HTMLCanvasElement): HTMLCanvasElement {
  const out = document.createElement('canvas')
  out.width = src.height
  out.height = src.width
  const ctx = out.getContext('2d')!
  ctx.transform(0, 1, 1, 0, 0, 0)
  ctx.drawImage(src, 0, 0)
  return out
}

function prepSideCanvas(src: HTMLCanvasElement, bgColor: string): HTMLCanvasElement {
  const source = src.height > src.width ? transposeSideCanvas(src) : src
  const outW = source.width * TEX_SCALE
  const outH = source.height * TEX_SCALE
  const out = document.createElement('canvas')
  out.width = outW
  out.height = outH
  const ctx = out.getContext('2d')!
  ctx.imageSmoothingEnabled = true
  ctx.imageSmoothingQuality = 'high'
  ctx.fillStyle = bgColor
  ctx.fillRect(0, 0, outW, outH)
  ctx.drawImage(source, 0, 0, outW, outH)
  return out
}

function applyTextureSettings(tex: THREE.CanvasTexture, anisotropy: number) {
  tex.colorSpace = THREE.SRGBColorSpace
  tex.generateMipmaps = true
  tex.minFilter = THREE.LinearMipmapLinearFilter
  tex.magFilter = THREE.LinearFilter
  tex.anisotropy = anisotropy
}

interface CakeGroupProps {
  topRef: React.RefObject<Konva.Stage | null>
  sideRef: React.RefObject<Konva.Stage | null>
  cakeShape: CakeShape
  updateTick: number
  baseColor: string
}

function CakeGroup({ topRef, sideRef, cakeShape, updateTick, baseColor }: CakeGroupProps) {
  const { gl } = useThree()
  const maxAnisotropy = gl.capabilities.getMaxAnisotropy()

  const [topTex, setTopTex] = useState<THREE.CanvasTexture | null>(null)
  const [sideTex, setSideTex] = useState<THREE.CanvasTexture | null>(null)
  const topTexRef = useRef<THREE.CanvasTexture | null>(null)
  const sideTexRef = useRef<THREE.CanvasTexture | null>(null)

  useEffect(() => {
    const topStage = topRef.current
    const sideStage = sideRef.current
    if (!topStage || !sideStage) return

    const croppedTop = cropTopCanvas(topStage.toCanvas(), baseColor)
    if (topTexRef.current) {
      topTexRef.current.image = croppedTop
      topTexRef.current.needsUpdate = true
    } else {
      const tex = new THREE.CanvasTexture(croppedTop)
      applyTextureSettings(tex, maxAnisotropy)
      topTexRef.current = tex
      setTopTex(tex)
    }

    const preparedSide = prepSideCanvas(sideStage.toCanvas(), baseColor)
    if (sideTexRef.current) {
      sideTexRef.current.image = preparedSide
      sideTexRef.current.needsUpdate = true
    } else {
      const tex = new THREE.CanvasTexture(preparedSide)
      applyTextureSettings(tex, maxAnisotropy)
      sideTexRef.current = tex
      setSideTex(tex)
    }
  }, [updateTick, topRef, sideRef, maxAnisotropy, baseColor])

  const radius = 1.5
  const height = 1.0

  const heartGeos = (() => {
    if (cakeShape !== 'heart') return null
    const s = radius

    // Body shape (canvas Y convention: tip at +y)
    const bodyShape = new THREE.Shape()
    bodyShape.moveTo(0, s)
    bodyShape.bezierCurveTo(-s * 0.2, s * 0.8, -s, s * 0.2, -s, -s * 0.2)
    bodyShape.bezierCurveTo(-s, -s * 0.7, -s * 0.5, -s, 0, -s * 0.6)
    bodyShape.bezierCurveTo(s * 0.5, -s, s, -s * 0.7, s, -s * 0.2)
    bodyShape.bezierCurveTo(s, s * 0.2, s * 0.2, s * 0.8, 0, s)

    // Top face shape (Y flipped so tip faces camera after rotation)
    const topShape = new THREE.Shape()
    topShape.moveTo(0, -s)
    topShape.bezierCurveTo(-s * 0.2, -s * 0.8, -s, -s * 0.2, -s, s * 0.2)
    topShape.bezierCurveTo(-s, s * 0.7, -s * 0.5, s, 0, s * 0.6)
    topShape.bezierCurveTo(s * 0.5, s, s, s * 0.7, s, s * 0.2)
    topShape.bezierCurveTo(s, -s * 0.2, s * 0.2, -s * 0.8, 0, -s)

    const extrudeGeo = new THREE.ExtrudeGeometry(bodyShape, { depth: height, bevelEnabled: false, curveSegments: 64 })

    const topGeo = new THREE.ShapeGeometry(topShape, 64)
    // Fix UVs: map to square region matching the square texture crop
    const positions = topGeo.getAttribute('position')
    const uvAttr = topGeo.getAttribute('uv')
    for (let i = 0; i < uvAttr.count; i++) {
      const x = positions.getX(i)
      const y = positions.getY(i)
      uvAttr.setXY(i, (x + s) / (2 * s), (y + s) / (2 * s))
    }
    uvAttr.needsUpdate = true

    return { extrudeGeo, topGeo }
  })()

  return (
    <group>
      {cakeShape === 'circle' && (
        <mesh castShadow>
          <cylinderGeometry args={[radius, radius, height, 64]} />
          <meshStandardMaterial map={sideTex ?? undefined} color={sideTex ? undefined : baseColor} roughness={0.8} metalness={0.0} />
        </mesh>
      )}
      {cakeShape === 'square' && (
        <mesh castShadow>
          <boxGeometry args={[radius * 1.8, height, radius * 1.8]} />
          <meshStandardMaterial map={sideTex ?? undefined} color={sideTex ? undefined : baseColor} roughness={0.8} metalness={0.0} />
        </mesh>
      )}
      {cakeShape === 'heart' && heartGeos && (
        <mesh castShadow geometry={heartGeos.extrudeGeo} rotation={[Math.PI / 2, 0, 0]} position={[0, height / 2, 0]}>
          <meshStandardMaterial map={sideTex ?? undefined} color={sideTex ? undefined : baseColor} roughness={0.8} metalness={0.0} />
        </mesh>
      )}

      {cakeShape === 'circle' && (
        <mesh position={[0, height / 2 + 0.003, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <circleGeometry args={[radius, 64]} />
          <meshStandardMaterial map={topTex ?? undefined} color={topTex ? undefined : baseColor} roughness={0.8} metalness={0.0} />
        </mesh>
      )}
      {cakeShape === 'square' && (
        <mesh position={[0, height / 2 + 0.003, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[radius * 1.8, radius * 1.8]} />
          <meshStandardMaterial map={topTex ?? undefined} color={topTex ? undefined : baseColor} roughness={0.8} metalness={0.0} />
        </mesh>
      )}
      {cakeShape === 'heart' && heartGeos && (
        <mesh geometry={heartGeos.topGeo} position={[0, height / 2 + 0.003, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <meshStandardMaterial map={topTex ?? undefined} color={topTex ? undefined : baseColor} roughness={0.8} metalness={0.0} />
        </mesh>
      )}
    </group>
  )
}

function CanvasCapture({ canvasRef }: { canvasRef: RefObject<HTMLCanvasElement | null> }) {
  const { gl } = useThree()
  useEffect(() => {
    canvasRef.current = gl.domElement
  }, [gl, canvasRef])
  return null
}

interface Props {
  topRef: React.RefObject<Konva.Stage | null>
  sideRef: React.RefObject<Konva.Stage | null>
  cakeShape: CakeShape
  updateTick: number
  canvasRef: RefObject<HTMLCanvasElement | null>
  baseColor: string
}

function InteractionHint() {
  const [visible, setVisible] = useState(() => {
    if (typeof window === 'undefined') return false
    return !localStorage.getItem('cake3d-hint-seen')
  })

  useEffect(() => {
    if (!visible) return
    const timer = setTimeout(() => {
      setVisible(false)
      localStorage.setItem('cake3d-hint-seen', '1')
    }, 5000)
    return () => clearTimeout(timer)
  }, [visible])

  const dismiss = () => {
    setVisible(false)
    localStorage.setItem('cake3d-hint-seen', '1')
  }

  return (
    <Fade in={visible} timeout={500}>
      <Box
        onClick={dismiss}
        onTouchStart={dismiss}
        sx={{
          position: 'absolute',
          inset: 0,
          zIndex: 10,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          bgcolor: 'rgba(0,0,0,0.2)',
          borderRadius: 4,
        }}
      >
        <Box sx={{ textAlign: 'center', color: 'white', px: 3, py: 2, borderRadius: 4, bgcolor: 'rgba(58,58,58,0.6)', backdropFilter: 'blur(8px)' }}>
          <Typography variant="body2" fontWeight={600} sx={{ mb: 0.5 }}>드래그로 회전 / 핀치로 확대</Typography>
          <Typography variant="caption" sx={{ opacity: 0.8 }}>탭하여 닫기</Typography>
        </Box>
      </Box>
    </Fade>
  )
}

export default function CakePreview3D({ topRef, sideRef, cakeShape, updateTick, canvasRef, baseColor }: Props) {
  const device = useDeviceType()
  const lowPerf = device !== 'pc'
  const maxDpr = lowPerf ? 1.5 : 2
  const shadowSize = lowPerf ? 1024 : 2048

  return (
    <Box sx={{ position: 'relative', width: '100%', height: '100%', minHeight: 400 }}>
      <InteractionHint />
      <Canvas
        dpr={[1, maxDpr]}
        camera={{ position: [0, 2.5, 5], fov: 45 }}
        shadows
        scene={{ background: new THREE.Color('#f2e8d8') }}
        gl={{
          antialias: true,
          powerPreference: 'high-performance',
          precision: 'highp',
          preserveDrawingBuffer: true,
        }}
      >
        <CanvasCapture canvasRef={canvasRef} />
        <ambientLight intensity={0.4} />
        {/* 메인 키 라이트 — 우측 상단에서 비춤 */}
        <directionalLight
          position={[4, 6, 3]}
          intensity={1.5}
          castShadow
          shadow-mapSize={[shadowSize, shadowSize]}
          shadow-camera-near={0.1}
          shadow-camera-far={30}
          shadow-camera-left={-5}
          shadow-camera-right={5}
          shadow-camera-top={5}
          shadow-camera-bottom={-5}
        />
        {/* 필 라이트 — 반대편에서 그림자를 부드럽게 */}
        <directionalLight position={[-3, 4, -2]} intensity={0.6} />
        {/* 림 라이트 — 뒤쪽에서 윤곽을 강조 */}
        <directionalLight position={[0, 3, -5]} intensity={0.8} />

        <CakeGroup
          topRef={topRef}
          sideRef={sideRef}
          cakeShape={cakeShape}
          updateTick={updateTick}
          baseColor={baseColor}
        />

        <mesh position={[0, -0.52, 0]} receiveShadow>
          <cylinderGeometry args={[2.2, 2.2, 0.05, 64]} />
          <meshStandardMaterial color={PLATE_COLOR} roughness={0.3} />
        </mesh>

        <OrbitControls
          enablePan={false}
          minDistance={3}
          maxDistance={10}
          maxPolarAngle={Math.PI / 1.8}
        />
        <Environment preset="city" />
      </Canvas>
    </Box>
  )
}
