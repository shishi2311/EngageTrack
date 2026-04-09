import { useParams } from 'react-router-dom'
import PageHeader from '../components/layout/PageHeader'

export default function ProjectDetailPage() {
  const { id } = useParams<{ id: string }>()
  return (
    <div className="page-enter">
      <PageHeader title="Project Detail" />
      <p style={{ color: 'var(--text-secondary)' }}>Project {id} — coming in Phase 2.</p>
    </div>
  )
}
