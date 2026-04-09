import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom'
import { useEffect, useRef } from 'react'
import Dashboard from './pages/Dashboard'
import ClientsPage from './pages/ClientsPage'
import ProjectDetailPage from './pages/ProjectDetailPage'
import NotFound from './pages/NotFound'
import AppShell from './components/layout/AppShell'

function AnimatedRoutes() {
  const location = useLocation()
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    el.style.transition = 'none'
    el.style.opacity = '0'
    el.style.transform = 'translateY(8px)'
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        el.style.transition = 'opacity 0.25s ease, transform 0.25s ease'
        el.style.opacity = '1'
        el.style.transform = 'translateY(0)'
      })
    })
  }, [location.pathname])

  return (
    <div ref={containerRef} style={{ minHeight: '100%' }}>
      <Routes location={location}>
        <Route path="/" element={<Dashboard />} />
        <Route path="/clients" element={<ClientsPage />} />
        <Route path="/projects" element={<Dashboard />} />
        <Route path="/projects/:id" element={<ProjectDetailPage />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </div>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AppShell>
        <AnimatedRoutes />
      </AppShell>
    </BrowserRouter>
  )
}
