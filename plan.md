# 케이크 도안 웹사이트 구현 계획

## Context

일반 소비자가 케이크 디자인을 직접 시각화할 수 있는 웹 에디터. 케이크의 윗면과 옆면을 2D 분해 도면 형태로 그리고, 실시간으로 3D 미리보기를 확인한 뒤, 완성된 도안을 PNG로 저장한다.

---

## 프로젝트 구조

```
/Users/pionari/Desktop/Workspaces/cake-designer/
├── src/
│   ├── app/
│   │   ├── page.tsx           # 메인 에디터 페이지
│   │   ├── layout.tsx         # 루트 레이아웃
│   │   └── globals.css        # 전역 스타일
│   ├── components/
│   │   ├── editor/
│   │   │   ├── index.tsx              # 에디터 레이아웃 컨테이너
│   │   │   ├── CakeShapeSelector.tsx  # 케이크 모양 선택 (원/사각/하트)
│   │   │   ├── DrawingPanel.tsx       # 좌측 패널: 윗면+옆면 캔버스 스택
│   │   │   ├── TopFaceCanvas.tsx      # 원형 클립 드로잉 캔버스
│   │   │   ├── SideFaceCanvas.tsx     # 사각형(펼침) 드로잉 캔버스
│   │   │   ├── Toolbar.tsx            # 도구 버튼 (브러쉬/지우개/채우기/도형/텍스트)
│   │   │   └── ColorPalette.tsx       # 색상 + 브러쉬 굵기 컨트롤
│   │   └── preview/
│   │       └── CakePreview3D.tsx      # react-three-fiber 2.5D 미리보기
│   ├── hooks/
│   │   ├── useDrawing.ts              # 드로잉 상태 & 로직
│   │   └── useExport.ts              # PNG 내보내기
│   └── types/
│       └── cake.ts                   # 타입 정의
```

---

## 기술 스택

| 역할 | 라이브러리 |
|------|-----------|
| 프레임워크 | Next.js 15 (App Router) + React 19 + TypeScript |
| 스타일 | Tailwind CSS v4 |
| 패키지 매니저 | pnpm |
| 드로잉 캔버스 | **react-konva** (Konva.js) |
| 3D 미리보기 | **react-three-fiber** + **@react-three/drei** |
| 내보내기 | Konva 내장 `.toDataURL()` |

기존 프로젝트 패턴:
- 경로 alias: `@/*` → `src/*`
- 파일명: kebab-case
- 서버 컴포넌트 기본, Canvas/Three.js 컴포넌트는 `"use client"` + dynamic import (`ssr: false`)

---

## 화면 레이아웃

```
┌───────────────────┬──────────────────────┐
│  [도구바]          │                      │
│  브러쉬 지우개     │   3D 미리보기         │
│  채우기 도형 텍스트 │  (react-three-fiber) │
├───────────────────┤   OrbitControls      │
│  [윗면 캔버스]     │   자동 회전          │
│   (원형 클립)      │                      │
├───────────────────┤                      │
│  [옆면 캔버스]     │                      │
│   (사각형 펼침)    │                      │
├───────────────────┼──────────────────────┤
│  색상 팔레트       │  케이크 모양 선택     │
│  굵기 슬라이더     │  PNG 다운로드 버튼    │
└───────────────────┴──────────────────────┘
```

---

## 핵심 구현 상세

### 1. 드로잉 캔버스 (react-konva)

**TopFaceCanvas.tsx**:
- `<Stage>` + `<Layer>` 구조
- 원형 클립: `<Group clipFunc={(ctx) => { ctx.arc(cx, cy, r, 0, Math.PI*2) }}>` 로 원 안에서만 그리기
- 사각/하트 케이크 선택 시 clipFunc 변경

**SideFaceCanvas.tsx**:
- 원형 케이크의 옆면 = 원주를 펼친 직사각형 (width = 2πr, height = 케이크 높이)
- 사각 케이크의 옆면 = 4면 전개도 (4분할 직사각형)

**드로잉 도구**:
```ts
type Tool = 'brush' | 'eraser' | 'fill' | 'rect' | 'circle' | 'line' | 'text'
```
- 브러쉬/지우개: Konva의 `line.globalCompositeOperation` 활용
- 채우기: HTML Canvas API로 flood fill 알고리즘 (BFS)
- 도형: mousedown→mousemove→mouseup 드래그로 Konva Shape 생성
- 텍스트: 클릭 위치에 Konva.Text 배치, inline 편집

### 2. 3D 미리보기 (react-three-fiber)

```tsx
// CakePreview3D.tsx ("use client", dynamic import ssr:false)
- CylinderGeometry (원형 케이크) / BoxGeometry (사각 케이크)
- 윗면 텍스처: TopFaceCanvas.toDataURL() → THREE.CanvasTexture
- 옆면 텍스처: SideFaceCanvas.toDataURL() → THREE.CanvasTexture
- @react-three/drei: OrbitControls, Environment preset="city"
- useEffect로 캔버스 변경 감지 → 텍스처 needsUpdate = true
- 디바운스 200ms로 성능 최적화
```

### 3. 상태 관리 (useDrawing hook)

```ts
// hooks/useDrawing.ts
interface DrawingState {
  tool: Tool
  color: string        // 현재 드로잉 색상
  size: number         // 브러쉬 굵기
  cakeShape: 'circle' | 'square' | 'heart'
  topRef: RefObject<Konva.Stage>
  sideRef: RefObject<Konva.Stage>
}
```

### 4. PNG 내보내기 (useExport hook)

```ts
// hooks/useExport.ts
// 윗면 + 옆면 캔버스를 하나의 HTML Canvas에 합성 후 다운로드
const exportToPNG = () => {
  const topDataUrl = topRef.current.toDataURL()
  const sideDataUrl = sideRef.current.toDataURL()
  // 두 이미지를 오프스크린 canvas에 나란히 배치
  // canvas.toBlob() → URL.createObjectURL → <a> 클릭으로 다운로드
}
```

---

## 구현 단계

- [x] 1. `pnpm create next-app cake-designer` + 의존성 설치
  - `react-konva konva`
  - `@react-three/fiber @react-three/drei three`
  - `@types/three`

- [x] 2. 기본 레이아웃 구현 (에디터 좌/우 분할)

- [x] 3. CakeShapeSelector + 도구바 + 색상 팔레트 UI

- [x] 4. TopFaceCanvas: 원형 클립 + 브러쉬/지우개 구현

- [x] 5. SideFaceCanvas: 직사각형 + 브러쉬/지우개 구현

- [x] 6. 채우기(flood fill) + 도형 도구 + 텍스트 도구 추가

- [x] 7. CakePreview3D: 텍스처 매핑 + OrbitControls

- [x] 8. PNG 내보내기 기능

---

## 검증 방법

- 브러쉬로 윗면 그리기 → 3D 미리보기 상단에 반영 확인
- 옆면 그리기 → 3D 원통 측면에 텍스처 반영 확인
- 케이크 모양 변경 (원→사각) → 클립 모양 및 3D 형태 변경 확인
- 색 채우기 → 특정 영역 단색 채움 확인
- 텍스트 입력 → 캔버스 위 텍스트 배치 확인
- PNG 다운로드 → 윗면+옆면 합성 이미지 저장 확인

---

## 개발 서버 실행

```bash
cd /Users/pionari/Desktop/Workspaces/cake-designer
pnpm dev
```

브라우저에서 http://localhost:3000 접속
