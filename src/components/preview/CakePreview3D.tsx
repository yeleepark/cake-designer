'use client'

import { useRef, useEffect, useState, type RefObject } from 'react'
import { Canvas, useThree } from '@react-three/fiber'
import { OrbitControls, Environment } from '@react-three/drei'
import * as THREE from 'three'
import type Konva from 'konva'
import type { CakeShape } from '@/types/cake'

const TOP_CANVAS_SIZE = 300
const TOP_RADIUS = 130
const CROP_SIZE = TOP_RADIUS * 2                        // 260
const CROP_OFFSET = (TOP_CANVAS_SIZE - CROP_SIZE) / 2  // 20
const PLATE_COLOR = '#f9fafb'

function withBg(src: HTMLCanvasElement, w: number, h: number, bgColor: string, offsetX = 0, offsetY = 0): HTMLCanvasElement {
  const out = document.createElement('canvas')
  out.width = w
  out.height = h
  const ctx = out.getContext('2d')!
  ctx.fillStyle = bgColor
  ctx.fillRect(0, 0, w, h)
  ctx.drawImage(src, offsetX, offsetY)
  return out
}

function cropTopCanvas(src: HTMLCanvasElement, bgColor: string): HTMLCanvasElement {
  return withBg(src, CROP_SIZE, CROP_SIZE, bgColor, -CROP_OFFSET, -CROP_OFFSET)
}

function prepSideCanvas(src: HTMLCanvasElement, bgColor: string): HTMLCanvasElement {
  return withBg(src, src.width, src.height, bgColor)
}

/** 텍스처 품질 설정 — 캔버스 텍스처에 최적화된 필터 적용 */
function applyTextureSettings(tex: THREE.CanvasTexture, anisotropy: number) {
  tex.colorSpace = THREE.SRGBColorSpace
  // 캔버스 텍스처는 non-POT이므로 밉맵 비활성화 후 Linear 필터 사용
  tex.generateMipmaps = false
  tex.minFilter = THREE.LinearFilter
  tex.magFilter = THREE.LinearFilter
  // Anisotropy: 비스듬한 각도에서도 선명하게
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

    // 윗면 텍스처
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

    // 옆면 텍스처
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

  return (
    <group>
      {cakeShape === 'circle' && (
        <mesh castShadow receiveShadow>
          <cylinderGeometry args={[radius, radius, height, 64]} />
          <meshStandardMaterial map={sideTex ?? undefined} color={sideTex ? undefined : baseColor} />
        </mesh>
      )}
      {cakeShape === 'square' && (
        <mesh castShadow receiveShadow>
          <boxGeometry args={[radius * 1.8, height, radius * 1.8]} />
          <meshStandardMaterial map={sideTex ?? undefined} color={sideTex ? undefined : baseColor} />
        </mesh>
      )}

      {/* 윗면: z-fighting 방지를 위해 0.003 위로 올림, meshBasicMaterial로 조명 영향 제거 */}
      {cakeShape === 'circle' && (
        <mesh position={[0, height / 2 + 0.003, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <circleGeometry args={[radius, 64]} />
          <meshBasicMaterial
            map={topTex ?? undefined}
            color={topTex ? undefined : baseColor}
          />
        </mesh>
      )}
      {cakeShape === 'square' && (
        <mesh position={[0, height / 2 + 0.003, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[radius * 1.8, radius * 1.8]} />
          <meshBasicMaterial
            map={topTex ?? undefined}
            color={topTex ? undefined : baseColor}
          />
        </mesh>
      )}
    </group>
  )
}

/** Three.js gl.domElement을 canvasRef에 연결하는 내부 컴포넌트 */
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

export default function CakePreview3D({ topRef, sideRef, cakeShape, updateTick, canvasRef, baseColor }: Props) {
  return (
    <div className="w-full h-full min-h-[400px]">
      <Canvas
        dpr={[1, 2]}
        camera={{ position: [0, 2.5, 5], fov: 45 }}
        shadows
        gl={{
          antialias: true,
          powerPreference: 'high-performance',
          precision: 'highp',
          preserveDrawingBuffer: true, // toDataURL() 캡처를 위해 필수
        }}
      >
        <CanvasCapture canvasRef={canvasRef} />
        <ambientLight intensity={0.6} />
        <directionalLight
          position={[5, 8, 5]}
          intensity={1.2}
          castShadow
          shadow-mapSize={[2048, 2048]}
          shadow-camera-near={0.1}
          shadow-camera-far={30}
          shadow-camera-left={-5}
          shadow-camera-right={5}
          shadow-camera-top={5}
          shadow-camera-bottom={-5}
        />
        <directionalLight position={[-5, 3, -5]} intensity={0.4} />

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
    </div>
  )
}
