import { useState } from 'react'

export type DeviceType = 'mobile' | 'tablet' | 'pc'

function detectDevice(): DeviceType {
  if (typeof window === 'undefined') return 'pc'

  const ua = navigator.userAgent

  // iPhone, iPod, Android+Mobile → mobile
  if (/iPhone|iPod/.test(ua) || (/Android/.test(ua) && /Mobile/.test(ua))) {
    return 'mobile'
  }

  // iPad (legacy UA), iPadOS (Mac UA + touch), Android without Mobile → tablet
  if (
    /iPad/.test(ua) ||
    (/Macintosh/.test(ua) && navigator.maxTouchPoints > 1) ||
    (/Android/.test(ua) && !/Mobile/.test(ua))
  ) {
    return 'tablet'
  }

  // Everything else (including touch laptops) → pc
  return 'pc'
}

export function useDeviceType(): DeviceType {
  const [device] = useState(detectDevice)
  return device
}
