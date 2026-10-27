import { Bar, BarChart, CartesianGrid, Pie, PieChart, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { isActive, useVerifications } from '../lib/useVerifications'
import { CARD } from '../lib/ui'

const COLORS = { awaiting_guest: '#64748b', pending_approval: '#f59e0b', verified: '#10b981', rejected: '#f43f5e' }

export default function Analytics() {
  const { rows } = useVerifications()
  const verified = rows.filter((r) => r.status === 'verified')

  const revenueByMonth = Object.entries(
    verified.reduce((m, r) => { const k = (r.check_in || r.created_at).slice(0, 7); m[k] = (m[k] || 0) + Number(r.amount || 0); return m }, {})
  ).sort().map(([month, revenue]) => ({ month, revenue }))

  const statusData = Object.keys(COLORS).map((s) => ({ name: s, value: rows.filter((r) => r.status === s).length })).filter((d) => d.value)

  // Occupancy: nights booked this month / (units × days in month)
  const now = new Date(), y = now.getFullYear(), m = now.getMonth(), dim = new Date(y, m + 1, 0).getDate()
  const units = new Set(rows.map((r) => r.property_unit)).size
  let nights = 0
  for (let d = 1; d <= dim; d++) {
    const key = new Date(Date.UTC(y, m, d)).toISOString().slice(0, 10)
    nights += verified.filter((r) => r.check_in && r.check_in <= key && key < r.check_out).length
  }
  const occupancy = units ? Math.round((nights / (units * dim)) * 100) : 0
  const approvalRate = rows.length ? Math.round((verified.length / rows.length) * 100) : 0

  const stats = [['Occupancy (this month)', `${occupancy}%`], ['Approval rate', `${approvalRate}%`], ['Active rentals', rows.filter(isActive).length]]

  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {stats.map(([l, v]) => <div key={l} className={CARD}><p className="text-sm text-slate-400">{l}</p><p className="text-3xl font-bold mt-2">{v}</p></div>)}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className={CARD}>
          <h2 className="font-semibold mb-4">Revenue by month (₾)</h2>
          <div className="h-64">
            <ResponsiveContainer><BarChart data={revenueByMonth}>
              <CartesianGrid stroke="#1e293b" /><XAxis dataKey="month" stroke="#94a3b8" /><YAxis stroke="#94a3b8" />
              <Tooltip contentStyle={{ background: '#0f172a', border: '1px solid #334155' }} />
              <Bar dataKey="revenue" fill="#3b82f6" radius={[6, 6, 0, 0]} />
            </BarChart></ResponsiveContainer>
          </div>
        </div>
        <div className={CARD}>
          <h2 className="font-semibold mb-4">Verifications by status</h2>
          <div className="h-64">
            <ResponsiveContainer><PieChart>
              <Pie data={statusData} dataKey="value" nameKey="name" outerRadius={90} label>
                {statusData.map((d) => <Cell key={d.name} fill={COLORS[d.name]} />)}
              </Pie>
              <Tooltip contentStyle={{ background: '#0f172a', border: '1px solid #334155' }} />
            </PieChart></ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  )
}
