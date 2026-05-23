import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'

export function CheckinsLast7DaysChart({ data }: { data: Array<{ day: string; count: number }> }) {
  if (!data || data.length === 0) return null

  return (
    <ResponsiveContainer width="100%" height={200}>
      <BarChart data={data} margin={{ top: 10, right: 8, left: 0, bottom: 8 }}>
        <XAxis dataKey="day" tick={{ fontSize: 12 }} />
        <YAxis />
        <Tooltip />
        <Bar dataKey="count" fill="#1a7a3c" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  )
}

export default CheckinsLast7DaysChart
