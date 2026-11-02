import { useState } from 'react'
import { Link } from 'react-router-dom'
import { DEMO, supabase } from '../lib/supabase'
import { isActive, useVerifications } from '../lib/useVerifications'
import { CalendarCheck2, Download, Home, Link2, Plus, Wallet, ShieldCheck, Clock } from 'lucide-react'
import { BTN, BTN_GHOST, BTN_OK, CARD, FIELD, GRID2, INPUT, LABEL, STATUS_DOT, STATUS_STYLE } from '../lib/ui'

const money = (n) => `₾${Number(n || 0).toLocaleString()}`

export default function Dashboard() {
  const { rows, loading, reload } = useVerifications()
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState({ property_unit: '', guest_email: '', amount: '' })
  const [link, setLink] = useState('')
  const [busyId, setBusyId] = useState(null)
  const [msg, setMsg] = useState('')

  const kpis = [
    ['Total Verifications', rows.length, ShieldCheck, 'bg-blue-500/15 text-blue-300', 'all time'],
    ['Pending Approval', rows.filter((r) => r.status === 'pending_approval').length, Clock, 'bg-amber-500/15 text-amber-300', 'needs your review'],
    ['Active Rentals', rows.filter(isActive).length, CalendarCheck2, 'bg-emerald-500/15 text-emerald-300', 'staying now'],
    ['Total Revenue', money(rows.filter((r) => r.status === 'verified').reduce((s, r) => s + Number(r.amount || 0), 0)), Wallet, 'bg-violet-500/15 text-violet-300', 'verified stays'],
  ]

  const create = async (e) => {
    e.preventDefault()
    const { data, error } = await supabase.from('verifications').insert({
      property_unit: form.property_unit, guest_email: form.guest_email || null, amount: Number(form.amount) || 0,
    }).select().single()
    if (error) return setMsg('Could not create the link. Make sure you are signed in.')
    setLink(`${window.location.origin}/verify/${data.id}`)
    setForm({ property_unit: '', guest_email: '', amount: '' }); reload()
  }

  const exportCsv = () => {
    const cols = ['guest_name', 'status', 'property_unit', 'check_in', 'check_out', 'amount', 'phone', 'guest_email']
    const esc = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`
    const csv = [cols.join(','), ...rows.map((r) => cols.map((c) => esc(r[c])).join(','))].join('\n')
    const a = document.createElement('a')
    a.href = URL.createObjectURL(new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8' }))
    a.download = 'verifications.csv'; a.click()
  }

  const approve = async (r) => {
    setBusyId(r.id); setMsg('')
    const { data: { session } } = await supabase.auth.getSession()
    const { error } = await supabase.from('verifications').update({ status: 'verified' }).eq('id', r.id)
    if (error) { setBusyId(null); return setMsg('Could not update the record.') }
    if (DEMO) { setMsg(`Demo: the agreement and invoice would now be emailed to ${r.guest_email || 'the guest'}.`); setBusyId(null); reload(); return }
    const res = await fetch('/api/send-verification-email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session?.access_token || ''}` },
      body: JSON.stringify({ verification_id: r.id }),
    })
    const out = await res.json().catch(() => ({}))
    setMsg(res.ok ? `Email sent to ${r.guest_email}.` : out.error || 'Email could not be sent.')
    setBusyId(null); reload()
  }

  const reject = async (r) => { await supabase.from('verifications').update({ status: 'rejected' }).eq('id', r.id); reload() }

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Overview</h1>
        <p className="text-slate-400 mt-1">Track guest verifications, approvals and revenue in one place.</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map(([label, value, Icon, tone, hint]) => (
          <div key={label} className={CARD}>
            <div className="flex items-start justify-between">
              <p className="text-sm text-slate-400">{label}</p>
              <span className={`h-9 w-9 rounded-xl grid place-items-center ${tone}`}><Icon className="h-4 w-4" /></span>
            </div>
            <p className="text-3xl font-bold mt-3 tracking-tight">{value}</p>
            <p className="text-xs text-slate-500 mt-1">{hint}</p>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap gap-3">
        <button className={BTN} onClick={() => { setOpen(true); setLink('') }}><Plus className="h-4 w-4" />შექმენი ახალი ვერიფიკაციის ლინკი</button>
        <button className={BTN_GHOST} onClick={exportCsv}><Download className="h-4 w-4" />ექსპორტი</button>
      </div>

      {msg && <p className="text-sm rounded-xl border border-blue-500/30 bg-blue-500/10 text-blue-100 px-4 py-3">{msg}</p>}

      {open && (
        <form onSubmit={create} className={`${CARD} flex flex-col gap-4`}>
          <h2 className="font-semibold text-lg">New verification link</h2>
          <div className={GRID2}>
            <div className={FIELD}><label className={LABEL}>Property unit</label>
              <input required className={INPUT} placeholder="Apt 12 · Vera" value={form.property_unit} onChange={(e) => setForm({ ...form, property_unit: e.target.value })} /></div>
            <div className={FIELD}><label className={LABEL}>Guest email (for the agreement)</label>
              <input className={INPUT} placeholder="guest@example.com" value={form.guest_email} onChange={(e) => setForm({ ...form, guest_email: e.target.value })} /></div>
            <div className={FIELD}><label className={LABEL}>Stay amount (₾)</label>
              <input className={INPUT} inputMode="decimal" placeholder="480" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} /></div>
          </div>
          <div className="flex gap-3">
            <button className={BTN} type="submit"><Link2 className="h-4 w-4" />Create link</button>
            <button className={BTN_GHOST} type="button" onClick={() => setOpen(false)}>Close</button>
          </div>
          {link && (
            <div className={`${FIELD} rounded-xl border border-emerald-500/30 bg-emerald-500/5 p-4`}>
              <label className="text-sm font-medium text-emerald-300">Link created. Send it to your guest</label>
              <input readOnly className={INPUT} value={link} onFocus={(e) => e.target.select()} />
              <Link className={`${BTN_GHOST} text-center`} to={link.slice(window.location.origin.length)}>Open guest page</Link>
            </div>
          )}
        </form>
      )}

      <div className={`${CARD} !p-0 overflow-hidden`}>
        <div className="px-6 py-4 border-b border-slate-800/80 flex items-center justify-between">
          <h2 className="font-semibold">Verifications</h2>
          <span className="text-xs text-slate-500">{rows.length} total</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="text-xs uppercase tracking-wider text-slate-500">
              <tr><th className="px-6 py-3 font-medium">Guest</th><th className="px-3 font-medium">Status</th><th className="px-3 font-medium">Unit</th><th className="px-6 font-medium">Action</th></tr>
            </thead>
            <tbody className="divide-y divide-slate-800/70">
              {loading && <tr><td colSpan={4} className="px-6 py-10 text-center text-slate-500">Loading…</td></tr>}
              {!loading && rows.length === 0 && (
                <tr><td colSpan={4} className="px-6 py-14 text-center">
                  <p className="text-slate-300 font-medium">No verifications yet</p>
                  <p className="text-slate-500 text-sm mt-1">Create a link and send it to your first guest.</p>
                </td></tr>
              )}
              {rows.map((r) => (
                <tr key={r.id} className="hover:bg-slate-800/30 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <span className="h-9 w-9 rounded-full bg-gradient-to-br from-blue-500/30 to-violet-500/30 border border-slate-700 grid place-items-center text-sm font-semibold">
                        {(r.guest_name || '?').trim().slice(0, 1).toUpperCase()}
                      </span>
                      <span className="font-medium">{r.guest_name || <span className="text-slate-500">Waiting for guest</span>}</span>
                    </div>
                  </td>
                  <td className="px-3">
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ring-1 ${STATUS_STYLE[r.status]}`}>
                      <span className={`h-1.5 w-1.5 rounded-full ${STATUS_DOT[r.status]}`} />{r.status}
                    </span>
                  </td>
                  <td className="px-3">
                    <div className="flex items-center gap-2"><Home className="h-4 w-4 text-slate-500" />{r.property_unit}</div>
                    {r.check_in && <p className="text-xs text-slate-500 mt-0.5 pl-6">{r.check_in} → {r.check_out}</p>}
                  </td>
                  <td className="px-6 py-3">
                    {r.status === 'awaiting_guest' && (
                      <Link className="text-blue-400 hover:text-blue-300 font-medium" to={`/verify/${r.id}`}>Open guest page</Link>
                    )}
                    {r.status === 'pending_approval' && (
                      <div className="flex flex-wrap gap-2">
                        <button className={BTN_OK} disabled={busyId === r.id} onClick={() => approve(r)}>✅ დადასტურება და მეილზე გაგზავნა</button>
                        <button className={`${BTN_GHOST} !py-2 text-sm`} onClick={() => reject(r)}>Reject</button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
