'use client'

import { useState, useEffect, type RefObject } from 'react'

export function useContainerSize(ref: RefObject<HTMLElement | null>) {
  const [width, setWidth] = useState(0)

  useEffect(() => {
    const el = ref.current
    if (!el) return

    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setWidth(entry.contentRect.width)
      }
    })

    observer.observe(el)
    setWidth(el.clientWidth)

    return () => observer.disconnect()
  }, [ref])

  return width
}
