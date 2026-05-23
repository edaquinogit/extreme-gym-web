import type { ReactNode } from 'react'

type ChartCardProps = {
  title: string
  description?: string
  loading?: boolean
  error?: string | null
  children?: ReactNode
}

export function ChartCard({ title, description, loading, error, children }: ChartCardProps) {
  return (
    <section className="content-panel" style={{ padding: 12 }} aria-labelledby={`chart-${title}`}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
        <div>
          <strong id={`chart-${title}`} style={{ display: 'block', fontSize: '0.98rem' }}>{title}</strong>
          {description && <small style={{ color: 'var(--color-text-muted)' }}>{description}</small>}
        </div>
      </header>

      <div style={{ minHeight: 160, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        {loading ? (
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <div className="spinner" style={{ width: 20, height: 20, borderRadius: 999, border: '3px solid', borderTopColor: 'transparent', animation: 'spin 900ms linear infinite' }} />
            <small style={{ color: 'var(--color-text-muted)' }}>Carregando...</small>
          </div>
        ) : error ? (
          <div style={{ textAlign: 'center' }}>
            <small style={{ color: 'var(--color-danger)' }}>{error}</small>
          </div>
        ) : (
          children
        )}
      </div>
    </section>
  )
}

export default ChartCard
