/**
 * GoCardless client. REST API v2, documented at https://docs.gocardless.com.
 * Live and sandbox hosts are identical apart from the base URL. Every request
 * needs a Bearer access token and a pinned `GoCardless-Version` header.
 *
 * Amounts are always integers in the minor unit (pence, cents), never floats.
 */

const SANDBOX = "https://api-sandbox.gocardless.com"
const LIVE = "https://api.gocardless.com"
const API_VERSION = "2015-07-06"

export class GcError extends Error {}

export interface GcLinks {
  [key: string]: string | undefined
}

export interface Customer {
  id: string
  email?: string
  given_name?: string
  family_name?: string
  company_name?: string
  country_code?: string
  created_at?: string
}

export interface Payment {
  id: string
  amount: number
  currency: string
  status: string
  description?: string
  charge_date?: string
  created_at?: string
  links?: GcLinks
}

export interface Refund {
  id: string
  amount: number
  currency: string
  status?: string
  created_at?: string
  links?: GcLinks
}

export interface Mandate {
  id: string
  status: string
  scheme?: string
  created_at?: string
  links?: GcLinks
}

export interface Subscription {
  id: string
  amount: number
  currency: string
  name?: string
  status: string
  interval_unit?: string
  interval?: number
  day_of_month?: number
  created_at?: string
  links?: GcLinks
}

export interface Payout {
  id: string
  amount: number
  currency: string
  status: string
  arrival_date?: string
  created_at?: string
}

export interface Balance {
  id: string
  amount: number
  currency: string
  name?: string
  balance_type?: string
}

export interface GcEvent {
  id: string
  action: string
  resource_type: string
  created_at?: string
  links?: GcLinks
}

interface ListResponse<T> {
  [collection: string]: T[] | undefined
}

export function baseUrl(): string {
  return process.env.GOCARDLESS_ENVIRONMENT === "sandbox" ? SANDBOX : LIVE
}

function accessToken(): string {
  const token = process.env.GOCARDLESS_ACCESS_TOKEN
  if (!token) {
    throw new GcError(
      "GOCARDLESS_ACCESS_TOKEN is not set. Create an access token in the GoCardless dashboard " +
        "(Developers -> API tokens) and export it before starting the server."
    )
  }
  return token
}

interface ApiErrorBody {
  error?: {
    message?: string
    code?: string
    errors?: Array<{ field?: string; message?: string }>
  }
}

async function request<T>(method: string, path: string, body?: unknown): Promise<T> {
  const res = await fetch(`${baseUrl()}${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${accessToken()}`,
      "GoCardless-Version": API_VERSION,
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: body === undefined ? undefined : JSON.stringify(body),
    signal: AbortSignal.timeout(20000),
  })

  const raw = await res.text()
  let parsed: unknown = null
  if (raw) {
    try {
      parsed = JSON.parse(raw)
    } catch {
      parsed = null
    }
  }

  if (!res.ok) {
    const err = parsed as ApiErrorBody | null
    const reason = err?.error?.message ?? res.statusText
    const details = (err?.error?.errors ?? [])
      .map((e) => `${e.field ?? "field"}: ${e.message ?? "invalid"}`)
      .join("; ")
    throw new GcError(
      `GoCardless ${method} ${path} failed (${res.status}): ${reason}${details ? ` - ${details}` : ""}`
    )
  }

  return parsed as T
}

function items<T>(payload: ListResponse<T>, collection: string): T[] {
  return payload[collection] ?? []
}

export function money(amount: number, currency: string): string {
  return `${(amount / 100).toFixed(2)} ${currency.toUpperCase()}`
}

function when(value?: string): string {
  return value ? value.replace("T", " ").replace(/\..*$/, " UTC") : "unknown"
}

export async function listCustomers(limit: number): Promise<Customer[]> {
  const data = await request<ListResponse<Customer>>("GET", `/customers?limit=${limit}`)
  return items(data, "customers")
}

export async function getCustomer(id: string): Promise<Customer> {
  return request<Customer>("GET", `/customers/${encodeURIComponent(id)}`)
}

export interface CreateCustomerInput {
  email: string
  given_name?: string
  family_name?: string
  address_line1?: string
  city?: string
  postal_code?: string
  country_code?: string
}

export async function createCustomer(input: CreateCustomerInput): Promise<Customer> {
  const data = await request<{ customers: Customer }>("POST", "/customers", {
    customers: input,
  })
  return data.customers
}

export async function listPayments(limit: number, status?: string): Promise<Payment[]> {
  const query = status
    ? `/payments?limit=${limit}&status=${encodeURIComponent(status)}`
    : `/payments?limit=${limit}`
  const data = await request<ListResponse<Payment>>("GET", query)
  return items(data, "payments")
}

export async function getPayment(id: string): Promise<Payment> {
  return request<Payment>("GET", `/payments/${encodeURIComponent(id)}`)
}

export interface CreatePaymentInput {
  amount: number
  currency: string
  mandate_id: string
  description?: string
  charge_date?: string
  reference?: string
}

export async function createPayment(input: CreatePaymentInput): Promise<Payment> {
  const data = await request<{ payments: Payment }>("POST", "/payments", {
    payments: {
      amount: input.amount,
      currency: input.currency,
      description: input.description,
      charge_date: input.charge_date,
      reference: input.reference,
      links: { mandate: input.mandate_id },
    },
  })
  return data.payments
}

export async function paymentAction(
  id: string,
  action: "cancel" | "retry"
): Promise<Payment> {
  const data = await request<{ payments: Payment }>(
    "POST",
    `/payments/${encodeURIComponent(id)}/actions/${action}`
  )
  return data.payments
}

export async function listRefunds(limit: number): Promise<Refund[]> {
  const data = await request<ListResponse<Refund>>("GET", `/refunds?limit=${limit}`)
  return items(data, "refunds")
}

export async function createRefund(
  paymentId: string,
  amount?: number,
  currency?: string
): Promise<Refund> {
  const refund: Record<string, unknown> = { links: { payment: paymentId } }
  if (amount !== undefined) refund.amount = amount
  if (currency !== undefined) refund.currency = currency
  const data = await request<{ refunds: Refund }>("POST", "/refunds", { refunds: refund })
  return data.refunds
}

export async function listMandates(limit: number): Promise<Mandate[]> {
  const data = await request<ListResponse<Mandate>>("GET", `/mandates?limit=${limit}`)
  return items(data, "mandates")
}

export async function getMandate(id: string): Promise<Mandate> {
  return request<Mandate>("GET", `/mandates/${encodeURIComponent(id)}`)
}

export async function mandateAction(
  id: string,
  action: "cancel" | "reinstate"
): Promise<Mandate> {
  const data = await request<{ mandates: Mandate }>(
    "POST",
    `/mandates/${encodeURIComponent(id)}/actions/${action}`
  )
  return data.mandates
}

export async function listSubscriptions(limit: number): Promise<Subscription[]> {
  const data = await request<ListResponse<Subscription>>("GET", `/subscriptions?limit=${limit}`)
  return items(data, "subscriptions")
}

export interface CreateSubscriptionInput {
  amount: number
  currency: string
  interval_unit: string
  mandate_id: string
  name?: string
  count?: number
}

export async function createSubscription(
  input: CreateSubscriptionInput
): Promise<Subscription> {
  const data = await request<{ subscriptions: Subscription }>("POST", "/subscriptions", {
    subscriptions: {
      amount: input.amount,
      currency: input.currency,
      interval_unit: input.interval_unit,
      name: input.name,
      count: input.count,
      links: { mandate: input.mandate_id },
    },
  })
  return data.subscriptions
}

export async function cancelSubscription(id: string): Promise<Subscription> {
  const data = await request<{ subscriptions: Subscription }>(
    "POST",
    `/subscriptions/${encodeURIComponent(id)}/actions/cancel`
  )
  return data.subscriptions
}

export async function listPayouts(limit: number): Promise<Payout[]> {
  const data = await request<ListResponse<Payout>>("GET", `/payouts?limit=${limit}`)
  return items(data, "payouts")
}

export async function getBalance(id: string): Promise<Balance> {
  return request<Balance>("GET", `/balances/${encodeURIComponent(id)}`)
}

export async function listEvents(limit: number): Promise<GcEvent[]> {
  const data = await request<ListResponse<GcEvent>>("GET", `/events?limit=${limit}`)
  return items(data, "events")
}

export function formatCustomer(c: Customer, index?: number): string {
  const name = [c.given_name, c.family_name].filter(Boolean).join(" ") || c.company_name || "unnamed"
  return [
    `${index !== undefined ? `${index + 1}. ` : ""}${name} - ${c.email ?? "no email"}`,
    `id: ${c.id}${c.country_code ? ` | country: ${c.country_code}` : ""}`,
    `created: ${when(c.created_at)}`,
  ].join("\n")
}

export function formatPayment(p: Payment, index?: number): string {
  return [
    `${index !== undefined ? `${index + 1}. ` : ""}${money(p.amount, p.currency)} - ${p.status}`,
    `id: ${p.id}${p.description ? ` | ${p.description}` : ""}`,
    `charge date: ${p.charge_date ?? "not set"} | created: ${when(p.created_at)}`,
  ].join("\n")
}

export function formatRefund(r: Refund, index?: number): string {
  return [
    `${index !== undefined ? `${index + 1}. ` : ""}${money(r.amount, r.currency)} - ${r.status ?? "pending"}`,
    `id: ${r.id}${r.links?.payment ? ` | payment: ${r.links.payment}` : ""}`,
    `created: ${when(r.created_at)}`,
  ].join("\n")
}

export function formatMandate(m: Mandate, index?: number): string {
  return [
    `${index !== undefined ? `${index + 1}. ` : ""}${m.status}${m.scheme ? ` - ${m.scheme}` : ""}`,
    `id: ${m.id}`,
    `created: ${when(m.created_at)}`,
  ].join("\n")
}

export function formatSubscription(s: Subscription, index?: number): string {
  return [
    `${index !== undefined ? `${index + 1}. ` : ""}${s.name ?? "Subscription"} - ${money(s.amount, s.currency)}`,
    `status: ${s.status} | every ${s.interval ?? 1} ${s.interval_unit ?? "month"}(s)`,
    `id: ${s.id} | created: ${when(s.created_at)}`,
  ].join("\n")
}

export function formatPayout(p: Payout, index?: number): string {
  return [
    `${index !== undefined ? `${index + 1}. ` : ""}${money(p.amount, p.currency)} - ${p.status}`,
    `id: ${p.id} | arrives: ${p.arrival_date ?? "unknown"}`,
  ].join("\n")
}

export function formatBalance(b: Balance): string {
  return [
    `${b.name ?? "Balance"}: ${money(b.amount, b.currency)}`,
    `id: ${b.id}${b.balance_type ? ` | type: ${b.balance_type}` : ""}`,
  ].join("\n")
}

export function formatEvent(e: GcEvent, index?: number): string {
  return [
    `${index !== undefined ? `${index + 1}. ` : ""}${e.action} (${e.resource_type})`,
    `id: ${e.id} | at: ${when(e.created_at)}`,
  ].join("\n")
}
