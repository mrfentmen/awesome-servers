import { spawn } from "node:child_process"
import { tmpdir } from "node:os"
import { join } from "node:path"

export interface InvoiceItem {
  description: string
  quantity: number
  price: number
}

export interface InvoiceData {
  from: { name: string; address: string; email: string }
  to: { name: string; address: string; email: string }
  items: InvoiceItem[]
  currency: string
}

const CARRIERS = ["UPS", "USPS", "FEDEX", "DHL"] as const
type Carrier = typeof CARRIERS[number]

const DEFAULT_PDF_TOOL = process.env.PDF_TOOL || "wkhtmltopdf"

export async function generateInvoice(data: InvoiceData): Promise<string> {
  const total = data.items.reduce((sum, item) => sum + item.quantity * item.price, 0)
  const html = generateInvoiceHtml(data, total)
  const outputPath = join(tmpdir(), `invoice-${Date.now()}.html`)
  require('fs').writeFileSync(outputPath, html)
  return outputPath
}

function generateInvoiceHtml(data: InvoiceData, total: number): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Invoice</title>
  <style>
    body { font-family: Arial, sans-serif; margin: 40px; }
    h1 { color: #333; }
    .header { border-bottom: 2px solid #333; padding-bottom: 20px; }
    .items { width: 100%; border-collapse: collapse; margin: 20px 0; }
    .items th, .items td { border: 1px solid #ddd; padding: 8px; text-align: left; }
    .total { text-align: right; font-weight: bold; }
  </style>
</head>
<body>
  <div class="header">
    <h1>Invoice</h1>
    <p>From: ${data.from.name}<br>${data.from.address}<br>${data.from.email}</p>
    <p>To: ${data.to.name}<br>${data.to.address}<br>${data.to.email}</p>
  </div>
  <table class="items">
    <thead><tr><th>Description</th><th>Qty</th><th>Price</th><th>Total</th></tr></thead>
    <tbody>
      ${data.items.map(i => `<tr><td>${i.description}</td><td>${i.quantity}</td><td>${i.price}</td><td>${i.quantity * i.price}</td></tr>`).join("")}
    </tbody>
  </table>
  <p class="total">Grand Total: ${data.currency} ${total.toFixed(2)}</p>
</body>
</html>`
}

export async function convertToPdf(htmlPath: string, outputPath: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const proc = spawn(DEFAULT_PDF_TOOL, [htmlPath, outputPath])
    proc.on("close", (code) => {
      if (code === 0) resolve(outputPath)
      else reject(new Error(`PDF conversion failed with code ${code}`))
    })
  })
}

export async function sendInvoiceViaCarrier(
  pdfPath: string,
  carrier: Carrier,
  trackNumber?: string,
): Promise<any> {
  const apiKey = getCarrierApiKey(carrier)
  const endpoint = getCarrierEndpoint(carrier)
  if (!apiKey || !endpoint) {
    throw new Error(`Carrier ${carrier} not configured. Set API_KEY and ENDPOINT env vars.`)
  }
  const formData = new FormData()
  formData.set("document", await readFileAsBuffer(pdfPath))
  formData.set("carrier", carrier.toLowerCase())
  if (trackNumber) formData.set("track_number", trackNumber)

  const res = await fetch(endpoint, {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}` },
    body: formData,
  })
  if (!res.ok) throw new Error(`Carrier API error: ${res.status}`)
  return res.json()
}

function getCarrierApiKey(carrier: Carrier): string | undefined {
  return process.env[`${carrier}_API_KEY`] || process.env.CARRIER_API_KEY
}

function getCarrierEndpoint(carrier: Carrier): string | undefined {
  return process.env[`${carrier}_ENDPOINT`] || process.env.CARRIER_ENDPOINT
}

async function readFileAsBuffer(path: string): Promise<Buffer> {
  const fs = await import("node:fs/promises")
  return fs.readFile(path)
}

export async function validateAddress(address: string, carrier: Carrier): Promise<boolean> {
  const endpoint = `https://api.${carrier.toLowerCase()}.com/address/validate?address=${encodeURIComponent(address)}`
  try {
    const res = await fetch(endpoint)
    return res.ok
  } catch {
    return false
  }
}

export async function createLabel(
  data: { from: string; to: string; weight: number; service: string },
  carrier: Carrier,
): Promise<any> {
  const apiKey = getCarrierApiKey(carrier)
  const endpoint = process.env[`${carrier}_LABEL_ENDPOINT`] || `https://api.${carrier.toLowerCase()}.com/labels`
  if (!apiKey) throw new Error(`Missing ${carrier} API key`)

  const res = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify(data),
  })
  if (!res.ok) throw new Error(`Label creation failed: ${res.status}`)
  return res.json()
}

export async function trackShipment(
  carrier: Carrier,
  trackNumber: string,
): Promise<any> {
  const apiKey = getCarrierApiKey(carrier)
  const username = process.env[`${carrier}_USERNAME`]
  const password = process.env[`${carrier}_PASSWORD`]

  const endpoint = `https://api.${carrier.toLowerCase()}.com/tracking/${trackNumber}`
  const headers: Record<string, string> = {}

  if (apiKey) headers.Authorization = `Bearer ${apiKey}`
  if (username && password) headers.Authorization = `Basic ${Buffer.from(`${username}:${password}`).toString("base64")}`

  const res = await fetch(endpoint, { headers })
  if (!res.ok) throw new Error(`Tracking failed: ${res.status}`)
  return res.json()
}

export function listCarriers(): Carrier[] {
  return [...CARRIERS]
}
