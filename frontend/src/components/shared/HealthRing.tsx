import { useEffect, useRef, useState } from 'react'
import type { HealthCategory } from '../../types'

interface HealthRingProps {
  score: number
  size?: 'sm' | 'md' | 'lg'
  showLabel?: boolean
}

const SIZE_MAP = {
  sm: { dim: 48, stroke: 4, fontSize: 11 },
  md: { dim: 72, stroke: 5, fontSize: 16 },
  lg: { dim: 120, stroke: 8, fontSize: 28 },
}

function getCategory(score: number): HealthCategory {
  if (score >= 80) return 'healthy'
  if (score >= 60) return 'at_risk'
  if (score >= 30) return 'critical'
  return 'failing'
}

const COLOR_MAP: Record<HealthCategory, string> = {
  healthy: 'var(--health-healthy)',
  at_risk: 'var(--health-at-risk)',
  critical: 'var(--health-critical)',
  failing: 'var(--health-failing)',
}

const GLOW_MAP: Record<HealthCategory, string> = {
  healthy: '0 0 12px rgba(34, 197, 94, 0.4)',
  at_risk: '0 0 12px rgba(234, 179, 8, 0.4)',
  critical: '0 0 12px rgba(249, 115, 22, 0.4)',
  failing: '0 0 12px rgba(239, 68, 68, 0.4)',
}

export function HealthRing({ score, size = 'md', showLabel = true }: HealthRingProps) {
  const { dim, stroke, fontSize } = SIZE_MAP[size]
  const [displayScore, setDisplayScore] = useState(0)
  const [dashOffset, setDashOffset] = useState(0)
  const animRef = useRef<number | null>(null)

  const radius = (dim - stroke) / 2
  const circumference = 2 * Math.PI * radius
  const category = getCategory(score)
  const color = COLOR_MAP[category]
  const glow = GLOW_MAP[category]
  const targetOffset = circumference * (1 - score / 100)

  useEffect(() => {
    const duration = 800
    const start = performance.now()
    const startOffset = circumference

    const animate = (now: number) => {
      const progress = Math.min((now - start) / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 3)
      setDisplayScore(Math.round(eased * score))
      setDashOffset(startOffset - eased * (startOffset - targetOffset))
      if (progress < 1) {
        animRef.current = requestAnimationFrame(animate)
      }
    }

    setDashOffset(circumference)
    animRef.current = requestAnimationFrame(animate)
    return () => {
      if (animRef.current) cancelAnimationFrame(animRef.current)
    }
  }, [score, circumference, targetOffset])

  return (
    <div style={{ position: 'relative', width: dim, height: dim, flexShrink: 0 }}>
      <svg width={dim} height={dim} style={{ transform: 'rotate(-90deg)' }}>
        <circle
          cx={dim / 2}
          cy={dim / 2}
          r={radius}
          fill="none"
          stroke="var(--bg-tertiary)"
          strokeWidth={stroke}
        />
        <circle
          cx={dim / 2}
          cy={dim / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={dashOffset}
          style={{ filter: `drop-shadow(${glow})`, transition: 'stroke 0.2s ease' }}
        />
      </svg>
      {showLabel && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color,
            fontSize,
            fontWeight: 700,
            fontFamily: 'var(--font-mono)',
            letterSpacing: '-0.03em',
          }}
        >
          {displayScore}
        </div>
      )}
    </div>
  )
}

export default HealthRing
