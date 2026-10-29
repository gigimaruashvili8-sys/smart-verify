// Vercel Serverless Function. Uses Resend only (no @vercel/email).
import { Resend } from 'resend'
import { createClient } from '@supabase/supabase-js'
import { agreementPdf, invoicePdf } from './_lib/pdfs.js'

const BUCKET = 'verification-docs'
const THIRTY_DAYS = 60 * 60 * 24 * 30

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })
  try {
    const { verification_id } = req.body || {}
    const token = (req.headers.authorization || '').replace('Bearer ', '')
    if (!verification_id) return res.status(400).json({ error: 'verification_id is required' })

    // Everything runs as the calling owner, so RLS enforces ownership. No service-role key.
    const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: `Bearer ${token}` } },
    })
    const { data: v, error } = await supabase.from('verifications').select('*').eq('id', verification_id).single()
    if (error || !v) return res.status(404).json({ error: 'Verification not found' })
    if (!v.guest_email) return res.status(422).json({ error: 'No guest email on this record' })

    // Generate PDFs when the owner hasn't already supplied their own URLs.
    let { pdf_agreement_url, invoice_pdf_url } = v
    const sign = async (p) => {
      const { data } = await supabase.storage.from(BUCKET).createSignedUrl(p, THIRTY_DAYS)
      return data?.signedUrl
    }
    const put = async (name, bytes) => {
      const p = `${v.id}/${name}`
      const { error: e } = await supabase.storage.from(BUCKET).upload(p, bytes, { contentType: 'application/pdf', upsert: true })
      if (e) throw new Error(`Upload failed: ${e.message}`)
      return sign(p)
    }
    if (!pdf_agreement_url) {
      let sig = null
      if (v.signature_path) {
        const { data } = await supabase.storage.from(BUCKET).download(v.signature_path)
        if (data) sig = new Uint8Array(await data.arrayBuffer())
      }
      pdf_agreement_url = await put('rental-agreement.pdf', await agreementPdf(v, sig))
    }
    if (!invoice_pdf_url) invoice_pdf_url = await put('invoice.pdf', await invoicePdf(v))
    await supabase.from('verifications').update({ pdf_agreement_url, invoice_pdf_url }).eq('id', v.id)

    const btn = (url, label) =>
      `<p><a href="${url}" style="display:inline-block;background:#2563eb;color:#fff;padding:12px 20px;border-radius:10px;text-decoration:none">${label}</a></p>`
    const html = `<div style="font-family:Arial,sans-serif;max-width:520px;margin:auto">
      <h2>Your booking is confirmed</h2>
      <p>Hello ${v.guest_name || ''}, your verification for <b>${v.property_unit}</b> has been approved.</p>
      ${btn(pdf_agreement_url, 'Download Rental Agreement')}
      ${btn(invoice_pdf_url, 'Download Payment Invoice')}
      <p style="color:#64748b;font-size:12px">Download links are valid for 30 days.</p>
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
    return res.status(500).json({ error: e.message || 'Unexpected error' })
  }
}
