interface SkeletonProps {
  width?: string | number
  height?: string | number
  variant?: 'text' | 'circle' | 'card'
  lines?: number
}

const shimmerStyle: React.CSSProperties = {
  background: 'linear-gradient(90deg, var(--bg-tertiary) 25%, var(--bg-hover) 50%, var(--bg-tertiary) 75%)',
  backgroundSize: '200% 100%',
  animation: 'shimmer 1.5s infinite',
  borderRadius: 'var(--radius-sm)',
}

export function Skeleton({ width = '100%', height = 16, variant = 'text', lines = 1 }: SkeletonProps) {
  if (variant === 'circle') {
    const size = typeof width === 'number' ? width : 40
    return (
      <div
        style={{
          ...shimmerStyle,
          width: size,
          height: size,
          borderRadius: '50%',
          flexShrink: 0,
        }}
      />
    )
  }

  if (variant === 'card') {
    return (
      <div
        style={{
          ...shimmerStyle,
          width,
          height: height ?? 120,
          borderRadius: 'var(--radius-lg)',
        }}
      />
    )
  }

  if (lines > 1) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, width }}>
        {Array.from({ length: lines }).map((_, i) => (
          <div
            key={i}
            style={{
              ...shimmerStyle,
              width: i === lines - 1 ? '60%' : '100%',
              height,
            }}
          />
        ))}
      </div>
    )
  }

  return (
    <div
      style={{
        ...shimmerStyle,
        width,
        height,
      }}
    />
  )
}

export default Skeleton
