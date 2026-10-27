// Vercel Serverless Function. Uses Resend only (no @vercel/email).
import { Resend } from 'resend'
import { createClient } from '@supabase/supabase-js'

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })
  try {
    const { verification_id } = req.body || {}
    const token = (req.headers.authorization || '').replace('Bearer ', '')
    if (!verification_id) return res.status(400).json({ error: 'verification_id is required' })

    // Query as the calling owner so RLS enforces ownership; no service-role key needed.
    const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: `Bearer ${token}` } },
    })
    const { data: v, error } = await supabase.from('verifications').select('*').eq('id', verification_id).single()
    if (error || !v) return res.status(404).json({ error: 'Verification not found' })
    if (!v.guest_email) return res.status(422).json({ error: 'No guest email on this record' })

    const link = (url, label) => url
      ? `<p><a href="${url}" style="display:inline-block;background:#2563eb;color:#fff;padding:12px 20px;border-radius:10px;text-decoration:none">${label}</a></p>`
      : ''
    const html = `<div style="font-family:Arial,sans-serif;max-width:520px;margin:auto">
      <h2>Your booking is confirmed</h2>
      <p>Hello ${v.guest_name || ''}, your verification for <b>${v.property_unit}</b> has been approved.</p>
      ${link(v.pdf_agreement_url, 'Download Rental Agreement')}
      ${link(v.invoice_pdf_url, 'Download Payment Invoice')}
    </div>`

    const resend = new Resend(process.env.RESEND_API_KEY)
    const { error: sendErr } = await resend.emails.send({
      from: process.env.RESEND_FROM || 'onboarding@resend.dev',
      to: v.guest_email,
      subject: 'Your rental agreement and invoice',
      html,
    })
    if (sendErr) return res.status(502).json({ error: sendErr.message })
    return res.status(200).json({ ok: true })
  } catch (e) {
    return res.status(500).json({ error: 'Unexpected error' })
  }
}
