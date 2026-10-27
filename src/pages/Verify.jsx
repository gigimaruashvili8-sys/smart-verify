import { useEffect, useRef, useState } from 'react'
import { useParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { BTN, BTN_GHOST, CARD, FIELD, GRID2, INPUT } from '../lib/ui'

const BUCKET = 'verification-docs'

function SignaturePad({ canvasRef, onChange }) {
  const drawing = useRef(false)
  const pos = (e) => {
    const c = canvasRef.current, r = c.getBoundingClientRect()
    return { x: (e.clientX - r.left) * (c.width / r.width), y: (e.clientY - r.top) * (c.height / r.height) }
  }
  const down = (e) => {
    drawing.current = true
    const ctx = canvasRef.current.getContext('2d'), p = pos(e)
    ctx.lineWidth = 3; ctx.lineCap = 'round'; ctx.strokeStyle = '#fff'
    ctx.beginPath(); ctx.moveTo(p.x, p.y)
    canvasRef.current.setPointerCapture(e.pointerId)
  }
  const move = (e) => {
    if (!drawing.current) return
    const ctx = canvasRef.current.getContext('2d'), p = pos(e)
    ctx.lineTo(p.x, p.y); ctx.stroke(); onChange(true)
  }
  const up = () => { drawing.current = false }
  const clear = () => {
    const c = canvasRef.current
    c.getContext('2d').clearRect(0, 0, c.width, c.height); onChange(false)
  }
  return (
    <div className={FIELD}>
      <canvas ref={canvasRef} width={700} height={260}
        className="w-full bg-slate-800/80 border border-slate-700 rounded-xl touch-none"
        onPointerDown={down} onPointerMove={move} onPointerUp={up} onPointerLeave={up} />
      <button type="button" onClick={clear} className={BTN_GHOST}>Clear</button>
    </div>
  )
}

export default function Verify() {
  const { id } = useParams()
  const [rec, setRec] = useState(null)
  const [state, setState] = useState('loading') // loading | ready | unavailable | done
  const [step, setStep] = useState(1)
  const [err, setErr] = useState('')
  const [busy, setBusy] = useState(false)
  const [f, setF] = useState({ name: '', pid: '', phone: '', in: '', out: '' })
  const [front, setFront] = useState(null)
  const [back, setBack] = useState(null)
  const [signed, setSigned] = useState(false)
  const canvasRef = useRef(null)

  useEffect(() => {
    supabase.rpc('get_verification', { p_id: id }).then(({ data }) => {
      const r = data?.[0]
      if (!r || r.status !== 'awaiting_guest') return setState(r ? 'done' : 'unavailable')
      setRec(r); setF((s) => ({ ...s, in: r.check_in || '', out: r.check_out || '' })); setState('ready')
    })
  }, [id])

  const set = (k) => (e) => setF({ ...f, [k]: e.target.value })

  const next = () => {
    setErr('')
    if (step === 1) {
      if (!f.name.trim()) return setErr('Enter your full name.')
      if (!/^\d{11}$/.test(f.pid)) return setErr('Personal ID must be exactly 11 digits.')
      if (!f.phone.trim()) return setErr('Enter your phone number.')
      if (!f.in || !f.out || f.out < f.in) return setErr('Select valid check-in and check-out dates.')
    }
    if (step === 2 && (!front || !back)) return setErr('Upload both the front and back of your document.')
    setStep(step + 1)
  }

  const upload = async (name, blob) => {
    const { error } = await supabase.storage.from(BUCKET).upload(`${id}/${name}`, blob, { contentType: blob.type })
    if (error) throw error
    return `${id}/${name}`
  }

  const submit = async () => {
    setErr('')
    if (!signed) return setErr('Please sign in the box above.')
    setBusy(true)
    try {
      const sigBlob = await new Promise((r) => canvasRef.current.toBlob(r, 'image/png'))
      const [pf, pb, ps] = await Promise.all([
        upload('front', front), upload('back', back), upload('signature.png', sigBlob),
      ])
      const { error } = await supabase.rpc('submit_verification', {
        p_id: id, p_name: f.name.trim(), p_pid: f.pid, p_phone: f.phone.trim(),
        p_in: f.in, p_out: f.out, p_front: pf, p_back: pb, p_sig: ps,
      })
      if (error) throw error
      setState('done')
    } catch (e) {
      setErr('Submission failed. Please try again.')
    }
    setBusy(false)
  }

  const Shell = ({ children }) => (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
      <div className={`${CARD} w-full max-w-xl`}>{children}</div>
    </div>
  )

  if (state === 'loading') return <Shell><p className="text-slate-400">Loading…</p></Shell>
  if (state === 'unavailable') return <Shell><p>This verification link is invalid or has expired.</p></Shell>
  if (state === 'done') return (
    <Shell><p className="text-xl text-center py-8">ვერიფიკაცია წარმატებით გაიგზავნა! გმადლობთ.</p></Shell>
  )

  return (
    <Shell>
      <div className="flex flex-col gap-6">
        <div>
          <h1 className="text-xl font-bold">Guest verification · {rec.property_unit}</h1>
          <p className="text-sm text-slate-400">Step {step} of 3</p>
        </div>

        {step === 1 && (
          <div className="flex flex-col gap-4">
            <div className={FIELD}><label className="text-sm text-slate-300">Full name</label>
              <input className={INPUT} value={f.name} onChange={set('name')} /></div>
            <div className={FIELD}><label className="text-sm text-slate-300">Personal ID number (11 digits)</label>
              <input className={INPUT} inputMode="numeric" maxLength={11} value={f.pid}
                onChange={(e) => setF({ ...f, pid: e.target.value.replace(/\D/g, '') })} /></div>
            <div className={FIELD}><label className="text-sm text-slate-300">Phone number</label>
              <input className={INPUT} type="tel" value={f.phone} onChange={set('phone')} /></div>
            <div className={GRID2}>
              <div className={FIELD}><label className="text-sm text-slate-300">Check-in</label>
                <input className={INPUT} type="date" value={f.in} onChange={set('in')} /></div>
              <div className={FIELD}><label className="text-sm text-slate-300">Check-out</label>
                <input className={INPUT} type="date" value={f.out} onChange={set('out')} /></div>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className={GRID2}>
            {[['Front of ID card / passport', setFront, front], ['Back of ID card / passport', setBack, back]].map(([label, setter, file]) => (
              <div key={label} className={FIELD}>
                <label className="text-sm text-slate-300">{label}</label>
                <input className={INPUT} type="file" accept="image/*" capture="environment"
                  onChange={(e) => setter(e.target.files?.[0] || null)} />
                {file && <img alt="" src={URL.createObjectURL(file)} className="rounded-xl max-h-40 object-cover" />}
              </div>
            ))}
          </div>
        )}

        {step === 3 && <SignaturePad canvasRef={canvasRef} onChange={setSigned} />}

        {err && <p className="text-rose-300 text-sm">{err}</p>}

        <div className="flex gap-3">
          {step > 1 && <button className={BTN_GHOST} onClick={() => setStep(step - 1)}>Back</button>}
          {step < 3
            ? <button className={`${BTN} flex-1`} onClick={next}>Continue</button>
            : <button className={`${BTN} flex-1`} disabled={busy} onClick={submit}>{busy ? 'Sending…' : 'Submit'}</button>}
        </div>
      </div>
    </Shell>
  )
}
