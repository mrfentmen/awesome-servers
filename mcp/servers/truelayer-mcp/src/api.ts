/**
 * TrueLayer client. Open banking data (accounts, balances, transactions,
 * cards, direct debits, standing orders) plus the Payments and refunds API.
 *
 * Auth is an OAuth bearer access token from the TrueLayer Console.
 * Docs: https://docs.truelayer.com
 */
const SANDBOX = "https://api.truelayer-sandbox.com"
const LIVE = "https://api.truelayer.com"

export class TlError extends Error {}

function baseUrl(): string {
  return process.env.TRUELAYER_ENVIRONMENT === "sandbox" ? SANDBOX : LIVE
}

function accessToken(): string {
  const token = process.env.TRUELAYER_ACCESS_TOKEN
  if (!token) {
    throw new TlError(
      "TRUELAYER_ACCESS_TOKEN is not set. Generate an access token in the TrueLayer Console and export it."
    )
  }
  return token
}

interface Envelope<T> {
  results?: T[]
  status?: string
}

async function request<T>(path: string, init?: { method?: string; body?: unknown }): Promise<T> {
  const method = init?.method ?? "GET"
  const headers: Record<string, string> = {
    Authorization: `Bearer ${accessToken()}`,
    Accept: "application/json",
  }
  if (init?.body !== undefined) headers["Content-Type"] = "application/json"

  const res = await fetch(`${baseUrl()}${path}`, {
    method,
    headers,
    body: init?.body === undefined ? undefined : JSON.stringify(init.body),
    signal: AbortSignal.timeout(20000),
  })
  const raw = await res.text()
  if (!res.ok) {
    throw new TlError(`TrueLayer error ${res.status}: ${raw.slice(0, 400)}`)
  }
  if (!raw) return {} as T
  return JSON.parse(raw) as T
}

async function requestList<T>(path: string): Promise<T[]> {
  const body = await request<Envelope<T>>(path)
  return body.results ?? []
}

export interface Provider {
  display_name?: string
}

export interface Account {
  account_id: string
  account_type?: string
  display_name?: string
  currency?: string
  provider?: Provider
  account_number?: { iban?: string; number?: string; sort_code?: string }
}

export interface Balance {
  currency?: string
  available?: number
  current?: number
  update_timestamp?: string
}

export interface Transaction {
  transaction_id: string
  timestamp?: string
  description?: string
  amount?: number
  currency?: string
  transaction_type?: string
  transaction_category?: string
  transaction_classification?: string[]
  merchant_name?: string
  running_balance?: { amount?: number; currency?: string }
}

export interface Card {
  account_id: string
  card_type?: string
  name_on_card?: string
  display_name?: string
  partial_card_number?: string
  currency?: string
  provider?: Provider
}

export interface DirectDebit {
  direct_debit_id: string
  name?: string
  status?: string
  currency?: string
  previous_payment_amount?: number
  previous_payment_timestamp?: string
}

export interface StandingOrder {
  standing_order_id: string
  reference?: string
  status?: string
  currency?: string
  frequency?: string
  next_payment_date?: string
  next_payment_amount?: number
  beneficiary?: { name?: string }
}

export interface Payment {
  id: string
  status?: string
  currency?: string
  amount_in_minor?: number
  reference?: string
  created_at?: string
  payment_method?: { type?: string; provider_id?: string; provider_selection?: { type?: string } }
}

export interface MerchantAccount {
  merchant_account_id: string
  currency?: string
  account_holder_name?: string
}

export interface Me {
  client_id?: string
  client_name?: string
  description?: string
  logo_uri?: string
  scopes?: string[]
  redirect_uris?: string[]
}

function query(params: Record<string, string | number | undefined>): string {
  const parts: string[] = []
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === "") continue
    parts.push(`${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`)
  }
  return parts.length ? `?${parts.join("&")}` : ""
}

export function money(amount: number | undefined, currency: string | undefined): string {
  if (amount === undefined) return "unknown"
  const formatted = amount.toFixed(2)
  return currency ? `${formatted} ${currency}` : formatted
}

export async function getMe(): Promise<Me> {
  return request<Me>("/data/v1/me")
}

export async function listAccounts(): Promise<Account[]> {
  return requestList<Account>("/data/v1/accounts")
}

export async function getAccount(accountId: string): Promise<Account> {
  return request<Account>(`/data/v1/accounts/${encodeURIComponent(accountId)}`)
}

export async function getAccountBalance(accountId: string): Promise<Balance> {
  return request<Balance>(`/data/v1/accounts/${encodeURIComponent(accountId)}/balance`)
}

export async function listTransactions(
  accountId: string,
  from?: string,
  to?: string
): Promise<Transaction[]> {
  const path = `/data/v1/accounts/${encodeURIComponent(accountId)}/transactions${query({ from, to })}`
  return requestList<Transaction>(path)
}

export async function listPendingTransactions(accountId: string): Promise<Transaction[]> {
  return requestList<Transaction>(
    `/data/v1/accounts/${encodeURIComponent(accountId)}/transactions/pending`
  )
}

export async function listCards(): Promise<Card[]> {
  return requestList<Card>("/data/v1/cards")
}

export async function getCardBalance(cardId: string): Promise<Balance> {
  return request<Balance>(`/data/v1/cards/${encodeURIComponent(cardId)}/balance`)
}

export async function listCardTransactions(cardId: string): Promise<Transaction[]> {
  return requestList<Transaction>(`/data/v1/cards/${encodeURIComponent(cardId)}/transactions`)
}

export async function listDirectDebits(): Promise<DirectDebit[]> {
  return requestList<DirectDebit>("/data/v1/direct_debits")
}

export async function listStandingOrders(): Promise<StandingOrder[]> {
  return requestList<StandingOrder>("/data/v1/standing_orders")
}

export interface CreatePaymentInput {
  amountInMinor: number
  currency: string
  reference?: string
  userId?: string
  merchantAccountId?: string
  accountHolderName?: string
}

export async function createPayment(input: CreatePaymentInput): Promise<Payment> {
  const beneficiary =
    input.merchantAccountId && input.merchantAccountId.length > 0
      ? {
          beneficiary: {
            type: "merchant_account",
            merchant_account_id: input.merchantAccountId,
            ...(input.accountHolderName ? { account_holder_name: input.accountHolderName } : {}),
          },
        }
      : {}

  const body: Record<string, unknown> = {
    amount_in_minor: input.amountInMinor,
    currency: input.currency,
    payment_method: {
      type: "bank_transfer",
      provider_selection: { type: "user_selected" },
      ...beneficiary,
    },
    ...(input.userId ? { user: { id: input.userId } } : {}),
    ...(input.reference ? { reference: input.reference } : {}),
  }

  return request<Payment>("/payments", { method: "POST", body })
}

export async function getPayment(paymentId: string): Promise<Payment> {
  return request<Payment>(`/payments/${encodeURIComponent(paymentId)}`)
}

export async function createRefund(
  paymentId: string,
  amountInMinor: number,
  reference?: string
): Promise<Payment> {
  return request<Payment>(`/payments/${encodeURIComponent(paymentId)}/refunds`, {
    method: "POST",
    body: { amount_in_minor: amountInMinor, ...(reference ? { reference } : {}) },
  })
}

export async function listMerchantAccounts(): Promise<MerchantAccount[]> {
  return requestList<MerchantAccount>("/merchant-accounts")
}

export async function listMerchantAccountTransactions(
  merchantAccountId: string
): Promise<Transaction[]> {
  return requestList<Transaction>(
    `/merchant-accounts/${encodeURIComponent(merchantAccountId)}/transactions`
  )
}

/* ---------- formatters ---------- */

export function formatAccount(a: Account): string {
  const number = a.account_number?.iban ?? a.account_number?.number
  return [
    `${a.display_name ?? a.account_id}`,
    `${a.account_type ?? "account"}${a.currency ? ` · ${a.currency}` : ""}`,
    a.provider?.display_name ? `Provider: ${a.provider.display_name}` : "",
    number ? `Number: ${number}` : "",
    `id: ${a.account_id}`,
  ]
    .filter(Boolean)
    .join("\n")
}

export function formatAccounts(accounts: Account[]): string {
  if (accounts.length === 0) return "No accounts returned for this access token."
  return accounts.map((a, i) => `${i + 1}. ${formatAccount(a).replace(/\n/g, "\n   ")}`).join("\n\n")
}

export function formatBalance(b: Balance): string {
  return [
    `Available: ${money(b.available, b.currency)}`,
    `Current: ${money(b.current, b.currency)}`,
    b.update_timestamp ? `Updated: ${b.update_timestamp}` : "",
  ]
    .filter(Boolean)
    .join("\n")
}

export function formatTransaction(t: Transaction): string {
  const sign = t.amount !== undefined && t.amount > 0 ? "+" : ""
  const amount = t.amount !== undefined ? `${sign}${t.amount.toFixed(2)}` : "?"
  const parts = [
    `${t.timestamp ?? ""} ${amount}${t.currency ? ` ${t.currency}` : ""}`.trim(),
    t.description ?? t.merchant_name ?? "No description",
    t.transaction_category ? `category: ${t.transaction_category}` : "",
    `id: ${t.transaction_id}`,
  ]
  return parts.filter(Boolean).join("\n")
}

export function formatTransactions(transactions: Transaction[]): string {
  if (transactions.length === 0) return "No transactions returned."
  return transactions.map(formatTransaction).join("\n\n")
}

export function formatCard(c: Card): string {
  return [
    `${c.display_name ?? c.name_on_card ?? c.account_id}`,
    [c.card_type, c.partial_card_number, c.currency].filter(Boolean).join(" · "),
    c.provider?.display_name ? `Provider: ${c.provider.display_name}` : "",
    `id: ${c.account_id}`,
  ]
    .filter(Boolean)
    .join("\n")
}

export function formatCards(cards: Card[]): string {
  if (cards.length === 0) return "No cards returned for this access token."
  return cards.map(formatCard).join("\n\n")
}

export function formatDirectDebit(d: DirectDebit): string {
  return [
    `${d.name ?? d.direct_debit_id} (${d.status ?? "unknown status"})`,
    d.previous_payment_amount !== undefined
      ? `Last payment: ${money(d.previous_payment_amount, d.currency)}${
          d.previous_payment_timestamp ? ` on ${d.previous_payment_timestamp}` : ""
        }`
      : "",
    `id: ${d.direct_debit_id}`,
  ]
    .filter(Boolean)
    .join("\n")
}

export function formatDirectDebits(items: DirectDebit[]): string {
  if (items.length === 0) return "No direct debits returned."
  return items.map(formatDirectDebit).join("\n\n")
}

export function formatStandingOrder(s: StandingOrder): string {
  return [
    `${s.reference ?? s.standing_order_id} (${s.status ?? "unknown status"})`,
    s.frequency ? `Frequency: ${s.frequency}` : "",
    s.next_payment_amount !== undefined
      ? `Next: ${money(s.next_payment_amount, s.currency)}${
          s.next_payment_date ? ` on ${s.next_payment_date}` : ""
        }`
      : "",
    s.beneficiary?.name ? `Beneficiary: ${s.beneficiary.name}` : "",
    `id: ${s.standing_order_id}`,
  ]
    .filter(Boolean)
    .join("\n")
}

export function formatStandingOrders(items: StandingOrder[]): string {
  if (items.length === 0) return "No standing orders returned."
  return items.map(formatStandingOrder).join("\n\n")
}

export function formatPayment(p: Payment): string {
  const amount =
    p.amount_in_minor !== undefined ? (p.amount_in_minor / 100).toFixed(2) : undefined
  return [
    `Payment ${p.id}`,
    `Status: ${p.status ?? "unknown"}`,
    amount ? `Amount: ${money(Number(amount), p.currency)}` : "",
    p.reference ? `Reference: ${p.reference}` : "",
    p.created_at ? `Created: ${p.created_at}` : "",
  ]
    .filter(Boolean)
    .join("\n")
}

export function formatMerchantAccount(m: MerchantAccount): string {
  return [
    m.account_holder_name ?? m.merchant_account_id,
    m.currency ? `Currency: ${m.currency}` : "",
    `id: ${m.merchant_account_id}`,
  ]
    .filter(Boolean)
    .join("\n")
}

export function formatMerchantAccounts(items: MerchantAccount[]): string {
  if (items.length === 0) return "No merchant accounts returned."
  return items.map(formatMerchantAccount).join("\n\n")
}

export function formatMe(me: Me): string {
  return [
    me.client_name ?? "TrueLayer application",
    me.client_id ? `client_id: ${me.client_id}` : "",
    me.description ?? "",
    me.scopes?.length ? `scopes: ${me.scopes.join(", ")}` : "",
  ]
    .filter(Boolean)
    .join("\n")
}
