import type { Metadata, Viewport } from 'next'
import { Jua, Gowun_Dodum } from 'next/font/google'
import { AppRouterCacheProvider } from '@mui/material-nextjs/v15-appRouter'
import { ThemeProvider } from '@mui/material/styles'
import CssBaseline from '@mui/material/CssBaseline'
import theme from '@/theme'
import './globals.css'

const jua = Jua({ weight: '400', subsets: ['latin'], variable: '--font-jua' })
const gowunDodum = Gowun_Dodum({ weight: '400', subsets: ['latin'], variable: '--font-gowun-dodum' })

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
}

export const metadata: Metadata = {
  title: '케이크 도안 디자이너',
  description: '케이크 디자인을 직접 그리고 3D로 미리보기 하세요',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <body className={`antialiased ${jua.variable} ${gowunDodum.variable}`}>
        <AppRouterCacheProvider options={{ enableCssLayer: true }}>
          <ThemeProvider theme={theme}>
            <CssBaseline />
            {children}
          </ThemeProvider>
        </AppRouterCacheProvider>
      </body>
    </html>
  )
}
