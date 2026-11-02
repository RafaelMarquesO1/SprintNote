"use client"

import { MotionConfig } from "motion/react"

// Envolve o app (5.2): quem pede menos movimento no sistema vê só opacidade.
export function MotionProvider({ children }: { children: React.ReactNode }) {
  return <MotionConfig reducedMotion="user">{children}</MotionConfig>
}
