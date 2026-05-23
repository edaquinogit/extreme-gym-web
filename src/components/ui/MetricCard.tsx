import React from 'react'

type MetricCardProps = {
  title: string
  value?: React.ReactNode
  helper?: string
  loading?: boolean
  error?: string | null
}

export function MetricCard({ title, value, helper, loading, error }: MetricCardProps) {
  return (
    <article className="metric-card" role="group" aria-label={title}>
      <div className="metric-card-header">
        <span>{title}</span>
        <i aria-hidden="true" />
      </div>

      {loading ? (
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div className="spinner" style={{ width: 20, height: 20, borderRadius: 999, border: '3px solid', borderTopColor: 'transparent', animation: 'spin 900ms linear infinite' }} />
          <small style={{ color: 'var(--color-text-muted)' }}>Carregando...</small>
        </div>
      ) : error ? (
        <div>
          <strong>-</strong>
          <small style={{ color: 'var(--color-danger)', display: 'block', marginTop: 6 }}>{error}</small>
        </div>
      ) : value === undefined || value === null ? (
        <div>
          <strong>-</strong>
          <small style={{ color: 'var(--color-text-muted)' }}>{helper}</small>
        </div>
      ) : (
        <>
          <strong>{value}</strong>
          {helper && <small>{helper}</small>}
        </>
      )}
    </article>
  )
}

export default MetricCard
