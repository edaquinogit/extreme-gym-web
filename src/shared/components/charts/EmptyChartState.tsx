export function EmptyChartState({ message }: { message?: string }) {
  return (
    <div style={{ padding: 12, textAlign: 'center', color: 'var(--color-text-muted)' }}>
      <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 6 }}>Sem dados suficientes</div>
      <div style={{ fontSize: 13 }}>{message ?? 'Ainda nao ha dados suficientes para este grafico.'}</div>
    </div>
  )
}

export default EmptyChartState
