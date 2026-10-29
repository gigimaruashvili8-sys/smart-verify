// In-memory stand-in for Supabase, used only when VITE_DEMO=true (preview build).
const d = (n) => { const x = new Date(); x.setDate(x.getDate() + n); return x.toISOString().slice(0, 10) }
let rows = [
  { id: 'demo-1', property_unit: 'Apt 12 · Vera', guest_name: 'გიორგი ბერიძე', guest_email: 'giorgi@example.com', status: 'pending_approval', check_in: d(1), check_out: d(5), amount: 480, phone: '+995555123456', created_at: d(-1) },
  { id: 'demo-2', property_unit: 'Studio 3 · Vake', guest_name: 'Anna Schmidt', guest_email: 'anna@example.com', status: 'verified', check_in: d(-2), check_out: d(3), amount: 650, phone: '+4915112345678', created_at: d(-6) },
  { id: 'demo-3', property_unit: 'Apt 7 · Sololaki', guest_name: 'ნინო გელაშვილი', guest_email: 'nino@example.com', status: 'verified', check_in: d(-20), check_out: d(-15), amount: 520, phone: '+995599000111', created_at: d(-25) },
  { id: 'demo-4', property_unit: 'Apt 12 · Vera', guest_name: 'John Carter', guest_email: 'john@example.com', status: 'rejected', check_in: d(8), check_out: d(10), amount: 210, phone: '+14155550123', created_at: d(-3) },
  { id: 'demo-5', property_unit: 'Studio 3 · Vake', guest_name: null, guest_email: 'guest@example.com', status: 'awaiting_guest', check_in: d(12), check_out: d(16), amount: 560, phone: null, created_at: d(0) },
]
const ok = (data) => Promise.resolve({ data, error: null })
export const demoClient = {
  auth: {
    signUp: () => ok({}), signInWithPassword: () => ok({}), signOut: () => ok({}),
    getSession: () => ok({ session: { access_token: 'demo' } }),
    onAuthStateChange: () => ({ data: { subscription: { unsubscribe() {} } } }),
  },
  from: () => ({
    select: () => ({ order: () => ok([...rows]) }),
    insert: (o) => ({ select: () => ({ single: () => {
      const r = { id: 'demo-' + Math.random().toString(36).slice(2, 8), status: 'awaiting_guest', created_at: d(0), guest_name: null, ...o }
      rows = [r, ...rows]; return ok(r)
    } }) }),
    update: (o) => ({ eq: (c, v) => { rows = rows.map((r) => (r[c] === v ? { ...r, ...o } : r)); return ok(null) } }),
  }),
  rpc: (fn, a) => {
    if (fn === 'get_verification') {
      const r = rows.find((x) => x.id === a.p_id)
      return ok(r ? [{ id: r.id, property_unit: r.property_unit, status: r.status, check_in: r.check_in, check_out: r.check_out }] : [])
    }
    rows = rows.map((r) => r.id === a.p_id ? { ...r, guest_name: a.p_name, personal_id: a.p_pid, phone: a.p_phone, check_in: a.p_in, check_out: a.p_out, status: 'pending_approval' } : r)
    return ok(null)
  },
  storage: { from: () => ({ upload: () => ok({}) }) },
}
