import { useEffect, useRef, useState } from 'react'

interface ProgressBarProps {
  value: number
  height?: number
  color?: string
  showLabel?: boolean
}

export function ProgressBar({ value, height = 4, color, showLabel = false }: ProgressBarProps) {
  const [width, setWidth] = useState(0)
  const rafRef = useRef<number | null>(null)

  useEffect(() => {
    // Animate from 0 to target on mount
    const duration = 600
    const start = performance.now()

    const animate = (now: number) => {
      const progress = Math.min((now - start) / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 3)
      setWidth(eased * value)
      if (progress < 1) {
        rafRef.current = requestAnimationFrame(animate)
      }
    }

    rafRef.current = requestAnimationFrame(animate)
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current) }
  }, [value])

  // Gradient based on value if no explicit color
  const resolvedColor = color ?? (
    value >= 80
      ? 'linear-gradient(90deg, var(--health-healthy), #4ADE80)'
      : value >= 60
      ? 'linear-gradient(90deg, var(--health-at-risk), #FCD34D)'
      : value >= 30
      ? 'linear-gradient(90deg, var(--health-critical), #FDBA74)'
      : 'linear-gradient(90deg, var(--health-failing), #F87171)'
  )

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <div
        style={{
          flex: 1,
          height,
          background: 'var(--bg-tertiary)',
          borderRadius: 9999,
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            width: `${width}%`,
            height: '100%',
            background: resolvedColor,
            borderRadius: 9999,
            transition: 'width 0.05s linear',
          }}
        />
      </div>
      {showLabel && (
        <span
          style={{
            fontSize: 'var(--text-xs)',
            fontFamily: 'var(--font-mono)',
            color: 'var(--text-secondary)',
            minWidth: 32,
            textAlign: 'right',
          }}
        >
          {Math.round(value)}%
        </span>
      )}
    </div>
  )
}

export default ProgressBar
