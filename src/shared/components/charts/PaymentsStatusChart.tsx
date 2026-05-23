import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts'

type DataItem = { name: string; value: number }

const COLORS: Record<string, string> = {
  PAGO: '#1a7a3c',
  PENDENTE: '#b7770d',
  ATRASADO: '#c0392b',
  CANCELADO: '#6b7280',
}

export function PaymentsStatusChart({ data }: { data: DataItem[] }) {
  if (!data || data.length === 0) return null

  return (
    <ResponsiveContainer width="100%" height={200}>
      <PieChart>
        <Pie data={data} dataKey="value" nameKey="name" innerRadius={48} outerRadius={80} paddingAngle={4}>
          {data.map((entry) => (
            <Cell key={entry.name} fill={COLORS[entry.name] ?? '#94a3b8'} />
          ))}
        </Pie>
        <Tooltip formatter={(value: number) => value} />
        <Legend verticalAlign="bottom" height={28} />
      </PieChart>
    </ResponsiveContainer>
  )
}

export default PaymentsStatusChart
