import { useMemo, useState } from 'react'
import { useVerifications } from '../lib/useVerifications'
import { BTN, BTN_GHOST, CARD } from '../lib/ui'

const iso = (d) => new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 10)

export default function Calendar() {
  const { rows } = useVerifications()
  const [view, setView] = useState('month')
  const [anchor, setAnchor] = useState(new Date())

  const days = useMemo(() => {
    const out = []
    if (view === 'week') {
      const s = new Date(anchor); s.setDate(s.getDate() - ((s.getDay() + 6) % 7))
      for (let i = 0; i < 7; i++) { const d = new Date(s); d.setDate(s.getDate() + i); out.push(d) }
    } else {
      const first = new Date(anchor.getFullYear(), anchor.getMonth(), 1)
      const s = new Date(first); s.setDate(1 - ((first.getDay() + 6) % 7))
      for (let i = 0; i < 42; i++) { const d = new Date(s); d.setDate(s.getDate() + i); out.push(d) }
    }
    return out
  }, [view, anchor])

  const bookings = rows.filter((r) => r.check_in && r.check_out && r.status !== 'rejected')
  const shift = (n) => {
    const d = new Date(anchor)
    view === 'week' ? d.setDate(d.getDate() + 7 * n) : d.setMonth(d.getMonth() + n)
    setAnchor(d)
  }

  return (
    <div className={`${CARD} flex flex-col gap-4`}>
      <div className="flex flex-wrap items-center gap-2">
        <button className={BTN_GHOST} onClick={() => shift(-1)}>←</button>
        <h1 className="font-bold text-lg px-2">{anchor.toLocaleDateString('ka-GE', { month: 'long', year: 'numeric' })}</h1>
        <button className={BTN_GHOST} onClick={() => shift(1)}>→</button>
        <div className="ml-auto flex gap-2">
          <button className={view === 'month' ? BTN : BTN_GHOST} onClick={() => setView('month')}>Month</button>
          <button className={view === 'week' ? BTN : BTN_GHOST} onClick={() => setView('week')}>Week</button>
        </div>
      </div>
      <div className="overflow-x-auto">
        <div className="grid grid-cols-7 gap-1 min-w-[720px]">
          {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((d) => <div key={d} className="text-xs text-slate-400 px-2">{d}</div>)}
          {days.map((d) => {
            const key = iso(d)
            const here = bookings.filter((b) => b.check_in <= key && key <= b.check_out)
            const dim = view === 'month' && d.getMonth() !== anchor.getMonth()
            return (
              <div key={key} className={`min-h-[90px] rounded-xl border border-slate-800 p-1.5 ${dim ? 'opacity-40' : ''}`}>
                <div className="text-xs text-slate-400">{d.getDate()}</div>
                {here.map((b) => {
                  const tag = b.check_in === key ? 'Check-in' : b.check_out === key ? 'Check-out' : 'Staying'
                  const color = b.status === 'verified' ? 'bg-emerald-500/20 text-emerald-200' : 'bg-amber-500/20 text-amber-200'
                  return (
                    <div key={b.id} className={`mt-1 rounded-md px-1.5 py-0.5 text-[11px] leading-tight ${color}`}>
                      {b.property_unit}: {b.guest_name || 'Guest'} · {tag}
                    </div>
                  )
                })}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
