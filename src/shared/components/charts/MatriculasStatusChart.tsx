import { PieChart, Pie, ResponsiveContainer, Cell, Tooltip, Legend } from 'recharts'

const COLORS: Record<string, string> = {
  ATIVA: '#1a7a3c',
  PENDENTE: '#b7770d',
  CANCELADA: '#6b7280',
  EXPIRADA: '#c0392b',
  VENCIDA: '#c0392b',
}

export function MatriculasStatusChart({ data }: { data: Array<{ name: string; value: number }> }) {
  if (!data || data.length === 0) return null

  return (
    <ResponsiveContainer width="100%" height={200}>
      <PieChart>
        <Pie data={data} dataKey="value" nameKey="name" innerRadius={40} outerRadius={72} paddingAngle={4}>
          {data.map((entry) => (
            <Cell key={entry.name} fill={COLORS[entry.name] ?? '#94a3b8'} />
          ))}
        </Pie>
        <Tooltip />
        <Legend verticalAlign="bottom" height={28} />
      </PieChart>
    </ResponsiveContainer>
  )
}

export default MatriculasStatusChart
