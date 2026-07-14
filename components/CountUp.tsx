'use client'

import { useEffect, useRef, useState } from 'react'

type Props = {
  value: number
  duration?: number // ミリ秒
  suffix?: string
}

// 0から目標値まで数字がカウントアップするアニメーション（ease-out）
export default function CountUp({ value, duration = 800, suffix = '' }: Props) {
  const [display, setDisplay] = useState(0)
  const frameRef = useRef<number | null>(null)

  useEffect(() => {
    const start = performance.now()

    function tick(now: number) {
      const progress = Math.min((now - start) / duration, 1)
      // 終盤ほど減速するイージング
      const eased = 1 - Math.pow(1 - progress, 3)
      setDisplay(Math.round(value * eased))
      if (progress < 1) {
        frameRef.current = requestAnimationFrame(tick)
      }
    }

    frameRef.current = requestAnimationFrame(tick)
    return () => {
      if (frameRef.current) cancelAnimationFrame(frameRef.current)
    }
  }, [value, duration])

  return <>{display}{suffix}</>
}
