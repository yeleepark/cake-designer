'use client'

import { createTheme } from '@mui/material/styles'

const theme = createTheme({
  palette: {
    primary: { main: '#8a6a4e', light: '#b8976e', dark: '#6a4e34' },
    background: {
      default: '#e8dcc8',
      paper: '#f2e8d8',
    },
    text: {
      primary: '#2a2218',
      secondary: '#6b5e50',
      disabled: '#a89e90',
    },
    divider: '#d4c8b4',
    grey: {
      50: '#efe5d5',
      100: '#e8dcc8',
      200: '#d4c8b4',
      300: '#c4b8a4',
      400: '#a89e90',
      500: '#6b5e50',
    },
    action: {
      selected: 'rgba(138,106,78,0.12)',
      hover: 'rgba(138,106,78,0.06)',
    },
  },
  breakpoints: {
    values: { xs: 0, sm: 600, md: 768, lg: 1200, xl: 1536 },
  },
  shape: {
    borderRadius: 12,
  },
  typography: {
    fontFamily: 'var(--font-gowun-dodum), -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    h1: { fontFamily: 'var(--font-gowun-dodum), sans-serif' },
    h2: { fontFamily: 'var(--font-gowun-dodum), sans-serif' },
    h3: { fontFamily: 'var(--font-gowun-dodum), sans-serif' },
    h4: { fontFamily: 'var(--font-gowun-dodum), sans-serif' },
    h5: { fontFamily: 'var(--font-gowun-dodum), sans-serif' },
    h6: { fontFamily: 'var(--font-gowun-dodum), sans-serif' },
    subtitle1: { fontFamily: 'var(--font-gowun-dodum), sans-serif' },
    subtitle2: { fontFamily: 'var(--font-gowun-dodum), sans-serif' },
    button: { fontFamily: 'var(--font-gowun-dodum), sans-serif' },
  },
  components: {
    MuiPopover: {
      defaultProps: { disableScrollLock: true },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          boxShadow: 'none',
          fontWeight: 600,
          '&:hover': { boxShadow: 'none' },
        },
        contained: {
          backgroundColor: '#8a6a4e',
          color: '#fff',
          '&:hover': { backgroundColor: '#6a4e34' },
        },
        outlined: {
          borderColor: '#c4b8a4',
          color: '#2a2218',
          '&:hover': { borderColor: '#8a6a4e', backgroundColor: 'rgba(138,106,78,0.06)' },
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
        },
      },
    },
    MuiSlider: {
      styleOverrides: {
        root: { color: '#8a6a4e' },
      },
    },
    MuiTabs: {
      styleOverrides: {
        indicator: { backgroundColor: '#8a6a4e' },
      },
    },
    MuiTab: {
      styleOverrides: {
        root: {
          '&.Mui-selected': { color: '#8a6a4e' },
        },
      },
    },
  },
})

export default theme
