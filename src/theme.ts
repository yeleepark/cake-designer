'use client'

import { createTheme } from '@mui/material/styles'

const theme = createTheme({
  palette: {
    primary: { main: '#7b9cc0', light: '#d4e3f0', dark: '#567a9e' },
    background: {
      default: '#f0ece4',
      paper: '#faf8f5',
    },
    text: {
      primary: '#3a3a3a',
      secondary: '#8a8580',
      disabled: '#b8b3ac',
    },
    divider: '#e0dbd3',
    grey: {
      50: '#f5f2ed',
      100: '#ece8e1',
      200: '#e0dbd3',
      300: '#d1cbc2',
      400: '#b8b3ac',
      500: '#8a8580',
    },
    action: {
      selected: '#e8edf4',
      hover: 'rgba(123,156,192,0.08)',
    },
  },
  breakpoints: {
    values: { xs: 0, sm: 600, md: 768, lg: 1200, xl: 1536 },
  },
  shape: {
    borderRadius: 16,
  },
  typography: {
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    h1: { fontFamily: 'Georgia, "Times New Roman", serif' },
    h2: { fontFamily: 'Georgia, "Times New Roman", serif' },
    h3: { fontFamily: 'Georgia, "Times New Roman", serif' },
    h4: { fontFamily: 'Georgia, "Times New Roman", serif' },
    h5: { fontFamily: 'Georgia, "Times New Roman", serif' },
    h6: { fontFamily: 'Georgia, "Times New Roman", serif' },
    subtitle1: { fontFamily: 'Georgia, "Times New Roman", serif' },
    subtitle2: { fontFamily: 'Georgia, "Times New Roman", serif' },
  },
  components: {
    MuiPopover: {
      defaultProps: { disableScrollLock: true },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 24,
          boxShadow: 'none',
          '&:hover': { boxShadow: 'none' },
        },
        contained: {
          backgroundColor: '#7b9cc0',
          '&:hover': { backgroundColor: '#567a9e' },
        },
        outlined: {
          borderColor: '#d1cbc2',
          color: '#3a3a3a',
          '&:hover': { borderColor: '#7b9cc0', backgroundColor: 'rgba(123,156,192,0.06)' },
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
        root: { color: '#7b9cc0' },
      },
    },
    MuiTabs: {
      styleOverrides: {
        indicator: { backgroundColor: '#7b9cc0' },
      },
    },
    MuiTab: {
      styleOverrides: {
        root: {
          '&.Mui-selected': { color: '#7b9cc0' },
        },
      },
    },
  },
})

export default theme
