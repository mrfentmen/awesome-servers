/**
 * Checkout.com client. Payments, refunds, customers, card tokens,
 * instruments and disputes against the documented REST API.
 *
 * Amounts are always integers in the currency's minor unit
 * (e.g. 1050 = 10.50 USD).
 */
const SANDBOX = "https://api.sandbox.checkout.com"
const LIVE = "https://api.checkout.com"

export function baseUrl(): string {
  return process.env.CHECKOUT_ENVIRONMENT?.toLowerCase() === "sandbox" ? SANDBOX : LIVE
}

export class CheckoutError extends Error {
  constructor(message: string, readonly status?: number) {
    super(message)
    this.name = "CheckoutError"
  }
}

function secretKey(): string {
  const key = process.env.CHECKOUT_SECRET_KEY
  if (!key) {
    throw new CheckoutError(
      "CHECKOUT_SECRET_KEY is not set. Export your Checkout.com secret key (sk_sbox_... or sk_...)."
    )
  }
  return key
}

export interface Payment {
  id: string
  status: string
  amount: number
  currency: string
  reference?: string
  approved?: boolean
  created_at?: string
  payment_type?: string
  customer?: { id?: string; email?: string; name?: string }
  source?: { type?: string; last4?: string; scheme?: string }
  response_summary?: string
  response_code?: string
}

export interface PaymentAction {
  id: string
  type: string
  processed_on?: string
  response_code?: string
  response_summary?: string
  amount?: number
}

export interface Refund {
  id: string
  status?: string
  amount?: number
  currency?: string
  reference?: string
  payment_id?: string
  action_id?: string
  created_on?: string
}

export interface Customer {
  id: string
  email?: string
  name?: string
  created_on?: string
}

export interface CardToken {
  token: string
  type?: string
  expires_on?: string
}

export interface Instrument {
  id: string
  type?: string
  scheme?: string
  last4?: string
  expiry_month?: number
  expiry_year?: number
  fingerprint?: string
}

export interface Dispute {
  id: string
  category?: string
  status?: string
  amount?: number
  currency?: string
  payment_id?: string
  received_on?: string
  resolution_reason?: string
}

interface ErrorBody {
  message?: string
  error_type?: string
  request_id?: string
  error_codes?: string[]
}

function summarise(body: unknown): string {
  if (typeof body === "string") return body.slice(0, 300)
  if (body && typeof body === "object") {
    const b = body as ErrorBody
    const parts = [b.message, b.error_type, ...(b.error_codes ?? [])].filter(Boolean)
    if (parts.length) return parts.join(" | ")
  }
  return "unknown error"
}

async function request<T>(path: string, method = "GET", body?: unknown): Promise<T> {
  const res = await fetch(`${baseUrl()}${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${secretKey()}`,
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: body === undefined ? undefined : JSON.stringify(body),
    signal: AbortSignal.timeout(20000),
  })

  const raw = await res.text()
  let parsed: unknown
  if (raw) {
    try {
      parsed = JSON.parse(raw)
    } catch {
      parsed = raw
    }
  }

  if (!res.ok) {
    throw new CheckoutError(`Checkout.com error ${res.status}: ${summarise(parsed)}`, res.status)
  }
  return parsed as T
}

function money(amount: number | undefined, currency: string | undefined): string {
  if (amount === undefined) return "amount unknown"
  return `${(amount / 100).toFixed(2)} ${currency ?? ""}`.trim()
}

export function createPayment(input: {
  token: string
  amount: number
  currency: string
  reference?: string
  capture?: boolean
  customerEmail?: string
  customerName?: string
}): Promise<Payment> {
  const body: Record<string, unknown> = {
    source: { type: "token", token: input.token },
    amount: input.amount,
    currency: input.currency,
    reference: input.reference,
    capture: input.capture ?? true,
  }
  if (input.customerEmail || input.customerName) {
    body.customer = { email: input.customerEmail, name: input.customerName }
  }
  return request<Payment>("/payments", "POST", body)
}

export function getPayment(paymentId: string): Promise<Payment> {
  return request<Payment>(`/payments/${encodeURIComponent(paymentId)}`)
}

export function getPaymentActions(paymentId: string): Promise<PaymentAction[]> {
  return request<PaymentAction[]>(`/payments/${encodeURIComponent(paymentId)}/actions`)
}

export function capturePayment(paymentId: string, amount?: number, reference?: string): Promise<PaymentAction> {
  return request<PaymentAction>(`/payments/${encodeURIComponent(paymentId)}/captures`, "POST", {
    amount,
    reference,
  })
}

export function voidPayment(paymentId: string, reference?: string): Promise<PaymentAction> {
  return request<PaymentAction>(`/payments/${encodeURIComponent(paymentId)}/voids`, "POST", { reference })
}

export function refundPayment(paymentId: string, amount?: number, reference?: string): Promise<Refund> {
  return request<Refund>(`/payments/${encodeURIComponent(paymentId)}/refunds`, "POST", { amount, reference })
}

export function getRefund(refundId: string): Promise<Refund> {
  return request<Refund>(`/refunds/${encodeURIComponent(refundId)}`)
}

export function createCustomer(email: string, name?: string): Promise<Customer> {
  return request<Customer>("/customers", "POST", { email, name })
}

export function getCustomer(customerId: string): Promise<Customer> {
  return request<Customer>(`/customers/${encodeURIComponent(customerId)}`)
}

export function createCardToken(input: {
  number: string
  expiryMonth: number
  expiryYear: number
  cvv: string
  name?: string
}): Promise<CardToken> {
  return request<CardToken>("/tokens", "POST", {
    type: "card",
    number: input.number,
    expiry_month: input.expiryMonth,
    expiry_year: input.expiryYear,
    cvv: input.cvv,
    name: input.name,
  })
}

export function createInstrument(token: string): Promise<Instrument> {
  return request<Instrument>("/instruments", "POST", { token })
}

export function getInstrument(instrumentId: string): Promise<Instrument> {
  return request<Instrument>(`/instruments/${encodeURIComponent(instrumentId)}`)
}

export function listDisputes(limit = 10): Promise<{ data?: Dispute[] }> {
  return request<{ data?: Dispute[] }>(`/disputes?limit=${limit}`)
}

export function getDispute(disputeId: string): Promise<Dispute> {
  return request<Dispute>(`/disputes/${encodeURIComponent(disputeId)}`)
}

export function formatPayment(p: Payment): string {
  return [
    `Payment ${p.id}`,
    `Status: ${p.status}${p.approved === false ? " (declined)" : ""}`,
    `Amount: ${money(p.amount, p.currency)}`,
    p.reference ? `Reference: ${p.reference}` : "",
    p.customer?.email ? `Customer: ${p.customer.email}` : "",
    p.source?.last4 ? `Card: ${p.source.scheme ?? "card"} ****${p.source.last4}` : "",
    p.response_summary ? `Response: ${p.response_summary} (${p.response_code ?? "-"})` : "",
    p.created_at ? `Created: ${p.created_at}` : "",
  ]
    .filter(Boolean)
    .join("\n")
}

export function formatAction(a: PaymentAction): string {
  return [
    `${a.type} ${a.id}`,
    a.amount !== undefined ? `Amount: ${money(a.amount, undefined)}` : "",
    a.response_summary ? `Response: ${a.response_summary} (${a.response_code ?? "-"})` : "",
    a.processed_on ? `Processed: ${a.processed_on}` : "",
  ]
    .filter(Boolean)
    .join("\n")
}

export function formatRefund(r: Refund): string {
  return [
    `Refund ${r.id}`,
    r.status ? `Status: ${r.status}` : "",
    r.amount !== undefined ? `Amount: ${money(r.amount, r.currency)}` : "",
    r.payment_id ? `Payment: ${r.payment_id}` : "",
    r.reference ? `Reference: ${r.reference}` : "",
    r.created_on ? `Created: ${r.created_on}` : "",
  ]
    .filter(Boolean)
    .join("\n")
}

export function formatCustomer(c: Customer): string {
  return [`Customer ${c.id}`, c.email ? `Email: ${c.email}` : "", c.name ? `Name: ${c.name}` : ""]
    .filter(Boolean)
    .join("\n")
}

export function formatInstrument(i: Instrument): string {
  return [
    `Instrument ${i.id}`,
    i.scheme ? `Scheme: ${i.scheme}` : "",
    i.last4 ? `Card: ****${i.last4}` : "",
    i.expiry_month && i.expiry_year ? `Expires: ${i.expiry_month}/${i.expiry_year}` : "",
  ]
    .filter(Boolean)
    .join("\n")
}

export function formatDispute(d: Dispute): string {
  return [
    `Dispute ${d.id}`,
    d.status ? `Status: ${d.status}` : "",
    d.category ? `Category: ${d.category}` : "",
    d.amount !== undefined ? `Amount: ${money(d.amount, d.currency)}` : "",
    d.payment_id ? `Payment: ${d.payment_id}` : "",
    d.received_on ? `Received: ${d.received_on}` : "",
  ]
    .filter(Boolean)
    .join("\n")
}
