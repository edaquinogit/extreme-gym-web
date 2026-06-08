type StatusBadgeProps = {
  status?: string | null
  className?: string
  children?: string
}

export function StatusBadge({
  status,
  className = '',
  children,
}: StatusBadgeProps) {
  const normalizedStatus = normalizeStatus(status)
  const statusClass = `is-${normalizedStatus.toLowerCase()}`

  return (
    <span
      className={`status-badge ${statusClass} ${className}`.trim()}
      data-status={normalizedStatus}
    >
      {children ?? formatStatus(normalizedStatus)}
    </span>
  )
}

function normalizeStatus(status?: string | null) {
  return String(status || 'INDEFINIDO').trim().toUpperCase()
}

function formatStatus(status: string) {
  return status.replaceAll('_', ' ')
}
