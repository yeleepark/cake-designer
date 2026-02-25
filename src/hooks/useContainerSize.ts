'use client'

import { useState, useEffect, type RefObject } from 'react'

export function useContainerSize(ref: RefObject<HTMLElement | null>) {
  const [size, setSize] = useState({ width: 0, height: 0 })

  useEffect(() => {
    const el = ref.current
    if (!el) return

    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setSize({ width: entry.contentRect.width, height: entry.contentRect.height })
      }
    })

    observer.observe(el)
    setSize({ width: el.clientWidth, height: el.clientHeight })

    return () => observer.disconnect()
  }, [ref])

  return size
}
