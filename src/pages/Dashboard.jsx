import { useState } from 'react'
import { Link } from 'react-router-dom'
import { DEMO, supabase } from '../lib/supabase'
import { isActive, useVerifications } from '../lib/useVerifications'
import { BTN, BTN_GHOST, CARD, FIELD, GRID2, INPUT, STATUS_STYLE } from '../lib/ui'

const money = (n) => `₾${Number(n || 0).toLocaleString()}`

export default function Dashboard() {
  const { rows, loading, reload } = useVerifications()
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState({ property_unit: '', guest_email: '', amount: '' })
  const [link, setLink] = useState('')
  const [busyId, setBusyId] = useState(null)
  const [msg, setMsg] = useState('')

  const kpis = [
    ['Total Verifications', rows.length],
    ['Pending Approval', rows.filter((r) => r.status === 'pending_approval').length],
    ['Active Rentals', rows.filter(isActive).length],
    ['Total Revenue', money(rows.filter((r) => r.status === 'verified').reduce((s, r) => s + Number(r.amount || 0), 0))],
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
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map(([label, value]) => (
          <div key={label} className={CARD}>
            <p className="text-sm text-slate-400">{label}</p>
            <p className="text-3xl font-bold mt-2">{value}</p>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap gap-3">
        <button className={BTN} onClick={() => { setOpen(true); setLink('') }}>შექმენი ახალი ვერიფიკაციის ლინკი</button>
        <button className={BTN_GHOST} onClick={exportCsv}>ექსპორტი</button>
      </div>

      {msg && <p className="text-sm text-slate-300">{msg}</p>}

      {open && (
        <form onSubmit={create} className={`${CARD} flex flex-col gap-4`}>
          <div className={GRID2}>
            <div className={FIELD}><label className="text-sm text-slate-300">Property unit</label>
              <input required className={INPUT} value={form.property_unit} onChange={(e) => setForm({ ...form, property_unit: e.target.value })} /></div>
            <div className={FIELD}><label className="text-sm text-slate-300">Guest email (for the agreement)</label>
              <input className={INPUT} value={form.guest_email} onChange={(e) => setForm({ ...form, guest_email: e.target.value })} /></div>
            <div className={FIELD}><label className="text-sm text-slate-300">Stay amount (₾)</label>
              <input className={INPUT} inputMode="decimal" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} /></div>
          </div>
          <div className="flex gap-3">
            <button className={BTN} type="submit">Create link</button>
            <button className={BTN_GHOST} type="button" onClick={() => setOpen(false)}>Close</button>
          </div>
          {link && (
            <div className={FIELD}>
              <label className="text-sm text-slate-300">Send this link to your guest</label>
              <input readOnly className={INPUT} value={link} onFocus={(e) => e.target.select()} />
              <Link className={`${BTN_GHOST} text-center`} to={link.slice(window.location.origin.length)}>Open guest page</Link>
            </div>
          )}
        </form>
      )}

      <div className={`${CARD} overflow-x-auto`}>
        <table className="w-full text-left text-sm">
          <thead className="text-slate-400">
            <tr><th className="py-2 pr-4">Guest</th><th className="pr-4">Status</th><th className="pr-4">Unit</th><th>Action</th></tr>
          </thead>
          <tbody>
            {loading && <tr><td colSpan={4} className="py-6 text-slate-400">Loading…</td></tr>}
            {!loading && rows.length === 0 && <tr><td colSpan={4} className="py-6 text-slate-400">No verifications yet. Create a link to get started.</td></tr>}
            {rows.map((r) => (
              <tr key={r.id} className="border-t border-slate-800">
                <td className="py-3 pr-4">{r.guest_name || '—'}</td>
                <td className="pr-4"><span className={`px-2.5 py-1 rounded-full text-xs ${STATUS_STYLE[r.status]}`}>{r.status}</span></td>
                <td className="pr-4">{r.property_unit}</td>
                <td>
                  {r.status === 'awaiting_guest' && (
                    <Link className="text-blue-400 hover:underline" to={`/verify/${r.id}`}>Open guest page</Link>
                  )}
                  {r.status === 'pending_approval' && (
                    <div className="flex flex-wrap gap-2">
                      <button className={BTN} disabled={busyId === r.id} onClick={() => approve(r)}>✅ დადასტურება და მეილზე გაგზავნა</button>
                      <button className={BTN_GHOST} onClick={() => reject(r)}>Reject</button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
