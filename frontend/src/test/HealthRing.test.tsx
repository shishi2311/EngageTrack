import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { HealthRing } from '../components/shared/HealthRing'

// requestAnimationFrame is not in jsdom — stub it out so the count-up runs to completion
beforeEach(() => {
  let calls = 0
  vi.spyOn(window, 'requestAnimationFrame').mockImplementation((cb) => {
    // Run at most 2 frames then stop to avoid infinite loop
    if (calls++ < 2) cb(performance.now() + 1000)
    return calls
  })
})

describe('HealthRing', () => {
  it('renders the score label', () => {
    render(<HealthRing score={85} />)
    // After animation frames the label is present in the DOM
    expect(screen.getByText(/\d+/)).toBeInTheDocument()
  })

  it('renders without label when showLabel=false', () => {
    const { container } = render(<HealthRing score={72} showLabel={false} />)
    const svg = container.querySelector('svg')
    expect(svg).toBeInTheDocument()
    // No numeric text node
    const divs = container.querySelectorAll('div > div')
    // The inner label div should not exist
    expect(container.querySelectorAll('[style*="position: absolute"]')).toHaveLength(0)
  })

  it('uses green color for healthy score (>=80)', () => {
    const { container } = render(<HealthRing score={90} />)
    const arcs = container.querySelectorAll('circle')
    // Second circle is the arc — stroke should include green health var
    const arc = arcs[1] as SVGCircleElement
    expect(arc.getAttribute('stroke')).toBe('var(--health-healthy)')
  })

  it('uses amber color for at-risk score (60-79)', () => {
    const { container } = render(<HealthRing score={65} />)
    const arcs = container.querySelectorAll('circle')
    const arc = arcs[1] as SVGCircleElement
    expect(arc.getAttribute('stroke')).toBe('var(--health-at-risk)')
  })

  it('uses orange color for critical score (30-59)', () => {
    const { container } = render(<HealthRing score={45} />)
    const arcs = container.querySelectorAll('circle')
    const arc = arcs[1] as SVGCircleElement
    expect(arc.getAttribute('stroke')).toBe('var(--health-critical)')
  })

  it('uses red color for failing score (<30)', () => {
    const { container } = render(<HealthRing score={15} />)
    const arcs = container.querySelectorAll('circle')
    const arc = arcs[1] as SVGCircleElement
    expect(arc.getAttribute('stroke')).toBe('var(--health-failing)')
  })

  it('renders at sm size with correct dimensions', () => {
    const { container } = render(<HealthRing score={50} size="sm" />)
    const svg = container.querySelector('svg')
    expect(svg?.getAttribute('width')).toBe('48')
    expect(svg?.getAttribute('height')).toBe('48')
  })

  it('renders at lg size with correct dimensions', () => {
    const { container } = render(<HealthRing score={50} size="lg" />)
    const svg = container.querySelector('svg')
    expect(svg?.getAttribute('width')).toBe('120')
    expect(svg?.getAttribute('height')).toBe('120')
  })
})
