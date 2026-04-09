export type HealthCategory = 'healthy' | 'at-risk' | 'critical' | 'failing'

export function getHealthCategory(score: number): HealthCategory {
  if (score >= 80) return 'healthy'
  if (score >= 60) return 'at-risk'
  if (score >= 30) return 'critical'
  return 'failing'
}

export function getHealthColor(score: number): string {
  const cat = getHealthCategory(score)
  const map: Record<HealthCategory, string> = {
    'healthy': 'var(--health-healthy)',
    'at-risk': 'var(--health-at-risk)',
    'critical': 'var(--health-critical)',
    'failing': 'var(--health-failing)',
  }
  return map[cat]
}
