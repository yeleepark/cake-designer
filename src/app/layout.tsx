import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: '케이크 도안 디자이너',
  description: '케이크 디자인을 직접 그리고 3D로 미리보기 하세요',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <body className="antialiased">{children}</body>
    </html>
  )
}
