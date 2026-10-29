import fs from 'node:fs'
import path from 'node:path'
import { PDFDocument, rgb } from 'pdf-lib'
import fontkit from '@pdf-lib/fontkit'

const fontBytes = () =>
  fs.readFileSync(path.join(process.cwd(), 'api', '_fonts', 'NotoSansGeorgian-Regular.ttf'))

async function build(title, lines) {
  const pdf = await PDFDocument.create()
  pdf.registerFontkit(fontkit)
  const font = await pdf.embedFont(fontBytes(), { subset: true })
  const page = pdf.addPage([595, 842])
  let y = 790
  page.drawText(title, { x: 50, y, size: 22, font, color: rgb(0.1, 0.2, 0.5) })
  y -= 20
  page.drawLine({ start: { x: 50, y }, end: { x: 545, y }, thickness: 1, color: rgb(0.8, 0.8, 0.85) })
  y -= 30
  for (const [label, value] of lines) {
    page.drawText(label, { x: 50, y, size: 10, font, color: rgb(0.45, 0.45, 0.5) })
    page.drawText(String(value ?? '—'), { x: 200, y, size: 12, font, color: rgb(0, 0, 0) })
    y -= 26
  }
  return { pdf, page, font, y }
}

const fmt = (n) => `₾${Number(n || 0).toFixed(2)}`

export async function agreementPdf(v, signaturePng) {
  const { pdf, page, font, y } = await build('Rental Agreement', [
    ['Agreement No.', v.id],
    ['Property unit', v.property_unit],
    ['Guest name', v.guest_name],
    ['Personal ID', v.personal_id],
    ['Phone', v.phone],
    ['Check-in', v.check_in],
    ['Check-out', v.check_out],
    ['Total amount', fmt(v.amount)],
  ])
  page.drawText('The guest confirms the details above and agrees to the house rules of the property.',
    { x: 50, y: y - 10, size: 10, font, color: rgb(0.3, 0.3, 0.35), maxWidth: 495 })
  page.drawText('Guest signature:', { x: 50, y: 230, size: 10, font, color: rgb(0.45, 0.45, 0.5) })
  if (signaturePng) {
    const img = await pdf.embedPng(signaturePng)
    // Signature is drawn in white for the dark UI; draw on a dark box so it stays visible.
    page.drawRectangle({ x: 50, y: 110, width: 240, height: 110, color: rgb(0.06, 0.09, 0.16) })
    page.drawImage(img, { x: 50, y: 110, width: 240, height: 110 })
  }
  return pdf.save()
}

export async function invoicePdf(v) {
  const nights = v.check_in && v.check_out
    ? Math.max(0, Math.round((new Date(v.check_out) - new Date(v.check_in)) / 86400000)) : ''
  const { pdf } = await build('Payment Invoice', [
    ['Invoice No.', `INV-${v.id.slice(0, 8).toUpperCase()}`],
    ['Issue date', new Date().toISOString().slice(0, 10)],
    ['Billed to', v.guest_name],
    ['Property unit', v.property_unit],
    ['Stay', `${v.check_in} → ${v.check_out}${nights !== '' ? ` (${nights} nights)` : ''}`],
    ['Amount due', fmt(v.amount)],
  ])
  return pdf.save()
}
