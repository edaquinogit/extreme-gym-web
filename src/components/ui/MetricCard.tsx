import React from 'react'

type MetricCardProps = {
  title: string
  value?: React.ReactNode
  helper?: string
  loading?: boolean
  error?: string | null
  actionLabel?: string
  onAction?: () => void
}

export function MetricCard({
  actionLabel,
  error,
  helper,
  loading,
  onAction,
  title,
  value,
}: MetricCardProps) {
  return (
    <article className="metric-card" role="group" aria-label={title}>
      <div className="metric-card-header">
        <span>{title}</span>
        <i aria-hidden="true" />
      </div>

      {loading ? (
        <div className="metric-card-loading">
          <div className="spinner metric-card-spinner" />
          <small>Carregando...</small>
        </div>
      ) : error ? (
        <div>
          <strong>-</strong>
          <small className="metric-card-error">{error}</small>
        </div>
      ) : value === undefined || value === null ? (
        <div>
          <strong>-</strong>
          <small>{helper}</small>
        </div>
      ) : (
        <>
          <strong>{value}</strong>
          {helper && <small>{helper}</small>}
        </>
      )}

      {onAction && !loading && !error && (
        <button className="metric-card-action" type="button" onClick={onAction}>
          {actionLabel ?? 'Ver detalhes'}
        </button>
      )}
    </article>
  )
}

export default MetricCard
