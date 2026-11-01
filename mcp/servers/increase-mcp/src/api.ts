/**
 * Increase API client.
 *
 * Every monetary amount in the Increase API is an integer number of cents —
 * never a float. Formatters print both the raw cents and a dollar string so a
 * caller can never mistake 2500 for $2500.
 */

export class IncreaseError extends Error {
  constructor(message: string) {
    super(message)
    this.name = "IncreaseError"
  }
}

export function baseUrl(): string {
  const raw = process.env.INCREASE_BASE_URL?.trim()
  const base = raw && raw !== "" ? raw : "https://api.increase.com"
  return base.replace(/\/+$/, "")
}

function apiKey(): string {
  const key = process.env.INCREASE_API_KEY?.trim()
  if (!key) {
    throw new IncreaseError(
      "INCREASE_API_KEY is not set. Create an API key in the Increase dashboard (https://dashboard.increase.com) and export it, e.g. INCREASE_API_KEY=production_xxx. Use INCREASE_BASE_URL=https://sandbox.increase.com for sandbox keys."
    )
  }
  return key
}

/* ------------------------------------------------------------------ */
/* Narrowing helpers — no `any` anywhere                               */
/* ------------------------------------------------------------------ */

function asObj(v: unknown): Record<string, unknown> | undefined {
  return typeof v === "object" && v !== null && !Array.isArray(v) ? (v as Record<string, unknown>) : undefined
}

function asArr(v: unknown): unknown[] {
  return Array.isArray(v) ? v : []
}

function field(obj: unknown, key: string): unknown {
  return asObj(obj)?.[key]
}

function str(v: unknown): string | undefined {
  return typeof v === "string" && v !== "" ? v : undefined
}

function num(v: unknown): number | undefined {
  return typeof v === "number" && Number.isFinite(v) ? v : undefined
}

function pick(obj: unknown, ...keys: string[]): unknown {
  for (const key of keys) {
    const value = field(obj, key)
    if (value !== undefined && value !== null) return value
  }
  return undefined
}

function firstStr(obj: unknown, ...keys: string[]): string | undefined {
  for (const key of keys) {
    const value = str(field(obj, key))
    if (value) return value
  }
  return undefined
}

function firstNum(obj: unknown, ...keys: string[]): number | undefined {
  for (const key of keys) {
    const value = num(field(obj, key))
    if (value !== undefined) return value
  }
  return undefined
}

/* ------------------------------------------------------------------ */
/* Models                                                              */
/* ------------------------------------------------------------------ */

export interface Account {
  id?: string
  accountNumber?: string
  name?: string
  status?: string
  currency?: string
  balance?: number
  availableBalance?: number
  type?: string
  createdAt?: string
}

export interface AccountNumber {
  id?: string
  accountId?: string
  accountNumber?: string
  routingNumber?: string
  status?: string
  inboundChecks?: string
  createdAt?: string
}

export interface Transaction {
  id?: string
  accountId?: string
  amount?: number
  currency?: string
  description?: string
  type?: string
  route?: string
  createdAt?: string
  created_at?: string
}

export interface TransferBase {
  id?: string
  accountId?: string
  amount?: number
  currency?: string
  status?: string
  description?: string
  createdAt?: string
  createdAtRaw?: string
}

export type AchTransfer = TransferBase & { statementDescriptor?: string; destinationAccountId?: string }
export type WireTransfer = TransferBase & { beneficiaryName?: string; imad?: string }
export type CheckTransfer = TransferBase & { checkNumber?: string; mailingAddress?: string }

export interface Card {
  id?: string
  accountId?: string
  status?: string
  type?: string
  last4?: string
  description?: string
  createdAt?: string
}

export interface Entity {
  id?: string
  name?: string
  entityType?: string
  status?: string
  email?: string
  createdAt?: string
}

export interface Limit {
  id?: string
  name?: string
  type?: string
  amount?: number
  interval?: string
  status?: string
}

export interface RoutingNumber {
  routingNumber?: string
  name?: string
  fundsTransfer?: string
}

export interface Event {
  id?: string
  type?: string
  createdAt?: string
  associatedObjectId?: string
  category?: string
}

export interface AccountStatement {
  id?: string
  accountId?: string
  statementPeriodStart?: string
  statementPeriodEnd?: string
  createdAt?: string
}

export interface Paged<T> {
  data: T[]
  nextCursor?: string
}

/* ------------------------------------------------------------------ */
/* Parsers                                                             */
/* ------------------------------------------------------------------ */

function parseAccount(v: unknown): Account {
  return {
    id: str(field(v, "id")),
    accountNumber: firstStr(v, "account_number", "accountNumber"),
    name: str(field(v, "name")),
    status: str(field(v, "status")),
    currency: str(field(v, "currency")),
    balance: firstNum(v, "balance"),
    availableBalance: firstNum(v, "available_balance", "availableBalance"),
    type: str(field(v, "type")),
    createdAt: firstStr(v, "created_at", "createdAt"),
  }
}

function parseAccountNumber(v: unknown): AccountNumber {
  return {
    id: str(field(v, "id")),
    accountId: firstStr(v, "account_id", "accountId"),
    accountNumber: firstStr(v, "account_number", "accountNumber"),
    routingNumber: firstStr(v, "routing_number", "routingNumber"),
    status: str(field(v, "status")),
    inboundChecks: firstStr(v, "inbound_checks", "inboundChecks"),
    createdAt: firstStr(v, "created_at", "createdAt"),
  }
}

function parseTransaction(v: unknown): Transaction {
  const created = firstStr(v, "created_at", "createdAt")
  return {
    id: str(field(v, "id")),
    accountId: firstStr(v, "account_id", "accountId"),
    amount: firstNum(v, "amount"),
    currency: str(field(v, "currency")),
    description: str(field(v, "description")),
    type: str(field(v, "type")),
    route: str(field(v, "route")),
    createdAt: created,
    created_at: created,
  }
}

function parseTransferBase(v: unknown): TransferBase {
  const created = firstStr(v, "created_at", "createdAt")
  return {
    id: str(field(v, "id")),
    accountId: firstStr(v, "account_id", "accountId"),
    amount: firstNum(v, "amount"),
    currency: str(field(v, "currency")),
    status: str(field(v, "status")),
    description: str(field(v, "description")),
    createdAt: created,
    createdAtRaw: created,
  }
}

function parseAchTransfer(v: unknown): AchTransfer {
  return {
    ...parseTransferBase(v),
    statementDescriptor: firstStr(v, "statement_descriptor", "statementDescriptor"),
    destinationAccountId: firstStr(v, "destination_account_id", "destinationAccountId"),
  }
}

function parseWireTransfer(v: unknown): WireTransfer {
  return {
    ...parseTransferBase(v),
    beneficiaryName: firstStr(v, "beneficiary_name", "beneficiaryName"),
    imad: str(field(v, "imad")),
  }
}

function parseCheckTransfer(v: unknown): CheckTransfer {
  return {
    ...parseTransferBase(v),
    checkNumber: firstStr(v, "check_number", "checkNumber"),
    mailingAddress: firstStr(v, "mailing_address", "mailingAddress"),
  }
}

function parseCard(v: unknown): Card {
  return {
    id: str(field(v, "id")),
    accountId: firstStr(v, "account_id", "accountId"),
    status: str(field(v, "status")),
    type: str(field(v, "type")),
    last4: firstStr(v, "last4"),
    description: str(field(v, "description")),
    createdAt: firstStr(v, "created_at", "createdAt"),
  }
}

function parseEntity(v: unknown): Entity {
  return {
    id: str(field(v, "id")),
    name: str(field(v, "name")),
    entityType: firstStr(v, "entity_type", "entityType", "structure"),
    status: str(field(v, "status")),
    email: str(field(v, "email")),
    createdAt: firstStr(v, "created_at", "createdAt"),
  }
}

function parseLimit(v: unknown): Limit {
  return {
    id: str(field(v, "id")),
    name: str(field(v, "name")),
    type: str(field(v, "type")),
    amount: firstNum(v, "amount"),
    interval: str(field(v, "interval")),
    status: str(field(v, "status")),
  }
}

function parseRoutingNumber(v: unknown): RoutingNumber {
  return {
    routingNumber: firstStr(v, "routing_number", "routingNumber"),
    name: str(field(v, "name")),
    fundsTransfer: firstStr(v, "funds_transfer", "fundsTransfer"),
  }
}

function parseEvent(v: unknown): Event {
  return {
    id: str(field(v, "id")),
    type: str(field(v, "type")),
    createdAt: firstStr(v, "created_at", "createdAt"),
    associatedObjectId: firstStr(v, "associated_object_id", "associatedObjectId"),
    category: str(field(v, "category")),
  }
}

function parseAccountStatement(v: unknown): AccountStatement {
  return {
    id: str(field(v, "id")),
    accountId: firstStr(v, "account_id", "accountId"),
    statementPeriodStart: firstStr(v, "statement_period_start", "statementPeriodStart"),
    statementPeriodEnd: firstStr(v, "statement_period_end", "statementPeriodEnd"),
    createdAt: firstStr(v, "created_at", "createdAt"),
  }
}

function parsePaged<T>(payload: unknown, parse: (v: unknown) => T): Paged<T> {
  return {
    data: asArr(pick(payload, "data", "items", "results")).map(parse),
    nextCursor: firstStr(payload, "next_cursor", "nextCursor"),
  }
}

/* ------------------------------------------------------------------ */
/* HTTP                                                                */
/* ------------------------------------------------------------------ */

type HttpMethod = "GET" | "POST" | "PATCH" | "PUT" | "DELETE"

export interface Query {
  limit?: number
  cursor?: string
  created_at?: Record<string, string>
}

interface RequestOptions {
  query?: Query
  body?: unknown
  idempotencyKey?: string
}

function buildQuery(url: URL, query: Query | undefined): void {
  if (!query) return
  if (query.limit !== undefined) url.searchParams.set("limit", String(query.limit))
  if (query.cursor) url.searchParams.set("cursor", query.cursor)
  if (query.created_at) {
    const filter = query.created_at
    if (filter.greater_than) url.searchParams.set("created_at.greater_than", filter.greater_than)
    if (filter.less_than) url.searchParams.set("created_at.less_than", filter.less_than)
  }
}

function errorDetail(raw: string, statusText: string): string {
  const trimmed = raw.trim()
  if (trimmed === "") return statusText
  try {
    const body = asObj(JSON.parse(trimmed) as unknown)
    const message = firstStr(body, "message", "detail", "error")
    if (message) return firstLine(message)
    const errors = asArr(field(body, "errors"))
    const parts: string[] = []
    for (const item of errors) {
      const text = firstStr(item, "message", "detail", "reason")
      if (text) parts.push(text)
    }
    if (parts.length > 0) return firstLine(parts.join("; "))
  } catch {
    // Not JSON — fall through to the raw text.
  }
  return firstLine(trimmed)
}

function firstLine(text: string): string {
  const line = text.split("\n")[0].trim()
  return line.length > 200 ? `${line.slice(0, 200)}…` : line
}

async function request(method: HttpMethod, path: string, opts: RequestOptions = {}): Promise<unknown> {
  const url = new URL(`${baseUrl()}${path}`)
  buildQuery(url, opts.query)

  const headers: Record<string, string> = {
    Authorization: `Bearer ${apiKey()}`,
    Accept: "application/json",
  }
  if (opts.body !== undefined) headers["Content-Type"] = "application/json"
  if (opts.idempotencyKey) headers["idempotency_key"] = opts.idempotencyKey

  let res: Response
  try {
    res = await fetch(url, {
      method,
      headers,
      body: opts.body === undefined ? undefined : JSON.stringify(opts.body),
      signal: AbortSignal.timeout(25000),
    })
  } catch (e) {
    const detail = e instanceof Error ? e.message : String(e)
    throw new IncreaseError(`Cannot reach Increase at ${baseUrl()}: ${detail}`)
  }

  const raw = await res.text()
  if (!res.ok) {
    throw new IncreaseError(`Increase ${res.status} on ${method} ${path}: ${errorDetail(raw, res.statusText)}`)
  }
  if (raw.trim() === "") return {}
  try {
    return JSON.parse(raw) as unknown
  } catch {
    throw new IncreaseError(`Increase returned non-JSON on ${method} ${path}: ${firstLine(raw)}`)
  }
}

function enc(id: string): string {
  return encodeURIComponent(id)
}

/* ------------------------------------------------------------------ */
/* Accounts                                                            */
/* ------------------------------------------------------------------ */

export async function listAccounts(query?: Query): Promise<Paged<Account>> {
  return parsePaged(await request("GET", "/accounts", { query }), parseAccount)
}

export async function createAccount(body: unknown, idempotencyKey?: string): Promise<Account> {
  return parseAccount(await request("POST", "/accounts", { body, idempotencyKey }))
}

export async function getAccount(accountId: string): Promise<Account> {
  return parseAccount(await request("GET", `/accounts/${enc(accountId)}`))
}

export async function updateAccount(accountId: string, body: unknown): Promise<Account> {
  return parseAccount(await request("PATCH", `/accounts/${enc(accountId)}`, { body }))
}

export async function listAccountNumbers(query?: Query): Promise<Paged<AccountNumber>> {
  return parsePaged(await request("GET", "/account_numbers", { query }), parseAccountNumber)
}

export async function createAccountNumber(body: unknown, idempotencyKey?: string): Promise<AccountNumber> {
  return parseAccountNumber(await request("POST", "/account_numbers", { body, idempotencyKey }))
}

export async function getAccountNumber(accountNumberId: string): Promise<AccountNumber> {
  return parseAccountNumber(await request("GET", `/account_numbers/${enc(accountNumberId)}`))
}

/* ------------------------------------------------------------------ */
/* Transactions                                                        */
/* ------------------------------------------------------------------ */

export async function listTransactions(query?: Query): Promise<Paged<Transaction>> {
  return parsePaged(await request("GET", "/transactions", { query }), parseTransaction)
}

export async function getTransaction(transactionId: string): Promise<Transaction> {
  return parseTransaction(await request("GET", `/transactions/${enc(transactionId)}`))
}

export async function listPendingTransactions(query?: Query): Promise<Paged<Transaction>> {
  return parsePaged(await request("GET", "/pending_transactions", { query }), parseTransaction)
}

export async function listDeclinedTransactions(query?: Query): Promise<Paged<Transaction>> {
  return parsePaged(await request("GET", "/declined_transactions", { query }), parseTransaction)
}

/* ------------------------------------------------------------------ */
/* ACH                                                                 */
/* ------------------------------------------------------------------ */

export async function listAchTransfers(query?: Query): Promise<Paged<AchTransfer>> {
  return parsePaged(await request("GET", "/ach_transfers", { query }), parseAchTransfer)
}

export async function createAchTransfer(body: unknown, idempotencyKey?: string): Promise<AchTransfer> {
  return parseAchTransfer(await request("POST", "/ach_transfers", { body, idempotencyKey }))
}

export async function getAchTransfer(id: string): Promise<AchTransfer> {
  return parseAchTransfer(await request("GET", `/ach_transfers/${enc(id)}`))
}

export async function approveAchTransfer(id: string): Promise<AchTransfer> {
  return parseAchTransfer(await request("POST", `/ach_transfers/${enc(id)}/approve`, { body: {} }))
}

export async function cancelAchTransfer(id: string): Promise<AchTransfer> {
  return parseAchTransfer(await request("POST", `/ach_transfers/${enc(id)}/cancel`, { body: {} }))
}

/* ------------------------------------------------------------------ */
/* Wires                                                               */
/* ------------------------------------------------------------------ */

export async function listWireTransfers(query?: Query): Promise<Paged<WireTransfer>> {
  return parsePaged(await request("GET", "/wire_transfers", { query }), parseWireTransfer)
}

export async function createWireTransfer(body: unknown, idempotencyKey?: string): Promise<WireTransfer> {
  return parseWireTransfer(await request("POST", "/wire_transfers", { body, idempotencyKey }))
}

export async function getWireTransfer(id: string): Promise<WireTransfer> {
  return parseWireTransfer(await request("GET", `/wire_transfers/${enc(id)}`))
}

export async function approveWireTransfer(id: string): Promise<WireTransfer> {
  return parseWireTransfer(await request("POST", `/wire_transfers/${enc(id)}/approve`, { body: {} }))
}

export async function cancelWireTransfer(id: string): Promise<WireTransfer> {
  return parseWireTransfer(await request("POST", `/wire_transfers/${enc(id)}/cancel`, { body: {} }))
}

/* ------------------------------------------------------------------ */
/* Checks                                                              */
/* ------------------------------------------------------------------ */

export async function listCheckTransfers(query?: Query): Promise<Paged<CheckTransfer>> {
  return parsePaged(await request("GET", "/check_transfers", { query }), parseCheckTransfer)
}

export async function createCheckTransfer(body: unknown, idempotencyKey?: string): Promise<CheckTransfer> {
  return parseCheckTransfer(await request("POST", "/check_transfers", { body, idempotencyKey }))
}

export async function getCheckTransfer(id: string): Promise<CheckTransfer> {
  return parseCheckTransfer(await request("GET", `/check_transfers/${enc(id)}`))
}

export async function stopCheckPayment(id: string): Promise<CheckTransfer> {
  return parseCheckTransfer(await request("POST", `/check_transfers/${enc(id)}/stop_payment`, { body: {} }))
}

/* ------------------------------------------------------------------ */
/* Cards, entities, limits, references                                 */
/* ------------------------------------------------------------------ */

export async function listCards(query?: Query): Promise<Paged<Card>> {
  return parsePaged(await request("GET", "/cards", { query }), parseCard)
}

export async function createCard(body: unknown, idempotencyKey?: string): Promise<Card> {
  return parseCard(await request("POST", "/cards", { body, idempotencyKey }))
}

export async function getCard(cardId: string): Promise<Card> {
  return parseCard(await request("GET", `/cards/${enc(cardId)}`))
}

export async function updateCard(cardId: string, body: unknown): Promise<Card> {
  return parseCard(await request("PATCH", `/cards/${enc(cardId)}`, { body }))
}

export async function listEntities(query?: Query): Promise<Paged<Entity>> {
  return parsePaged(await request("GET", "/entities", { query }), parseEntity)
}

export async function createEntity(body: unknown, idempotencyKey?: string): Promise<Entity> {
  return parseEntity(await request("POST", "/entities", { body, idempotencyKey }))
}

export async function getEntity(entityId: string): Promise<Entity> {
  return parseEntity(await request("GET", `/entities/${enc(entityId)}`))
}

export async function listLimits(query?: Query): Promise<Paged<Limit>> {
  return parsePaged(await request("GET", "/limits", { query }), parseLimit)
}

export async function getLimit(limitId: string): Promise<Limit> {
  return parseLimit(await request("GET", `/limits/${enc(limitId)}`))
}

export async function listRoutingNumbers(query?: Query): Promise<Paged<RoutingNumber>> {
  return parsePaged(await request("GET", "/routing_numbers", { query }), parseRoutingNumber)
}

export async function listEvents(query?: Query): Promise<Paged<Event>> {
  return parsePaged(await request("GET", "/events", { query }), parseEvent)
}

export async function listAccountStatements(query?: Query): Promise<Paged<AccountStatement>> {
  return parsePaged(await request("GET", "/account_statements", { query }), parseAccountStatement)
}

/* ------------------------------------------------------------------ */
/* Formatters                                                          */
/* ------------------------------------------------------------------ */

/** Increase uses integer cents; never divide by 100 without saying so. */
export function formatCents(cents: number | undefined): string {
  if (cents === undefined) return "unknown amount"
  const sign = cents < 0 ? "-" : ""
  const abs = Math.abs(cents)
  const dollars = Math.floor(abs / 100)
  const remainder = String(abs % 100).padStart(2, "0")
  return `${sign}$${dollars.toLocaleString("en-US")}.${remainder} (${cents} cents)`
}

function or(value: string | number | undefined, fallback = "—"): string {
  return value === undefined ? fallback : String(value)
}

export function formatAccount(a: Account): string {
  return [
    `Account ${or(a.id)}`,
    `  name: ${or(a.name)}`,
    `  status: ${or(a.status)} · currency: ${or(a.currency)}`,
    `  account number: ${or(a.accountNumber)}`,
    `  balance: ${formatCents(a.balance)} · available: ${formatCents(a.availableBalance)}`,
    `  created: ${or(a.createdAt)}`,
  ].join("\n")
}

export function formatAccountNumber(a: AccountNumber): string {
  return [
    `Account number ${or(a.id)}`,
    `  account: ${or(a.accountId)}`,
    `  number: ${or(a.accountNumber)} · routing: ${or(a.routingNumber)}`,
    `  status: ${or(a.status)} · inbound checks: ${or(a.inboundChecks)}`,
  ].join("\n")
}

export function formatTransaction(t: Transaction): string {
  return [
    `Transaction ${or(t.id)}`,
    `  ${formatCents(t.amount)} · ${or(t.currency)}`,
    `  type: ${or(t.type)} · route: ${or(t.route)}`,
    `  account: ${or(t.accountId)}`,
    `  ${or(t.description)}`,
    `  ${or(t.createdAt)}`,
  ].join("\n")
}

export function formatTransfer(t: TransferBase, kind: string): string {
  return [
    `${kind} ${or(t.id)}`,
    `  ${formatCents(t.amount)} · ${or(t.currency)} · status: ${or(t.status)}`,
    `  account: ${or(t.accountId)}`,
    `  ${or(t.description)}`,
    `  created: ${or(t.createdAt)}`,
  ].join("\n")
}

export function formatCard(c: Card): string {
  return [
    `Card ${or(c.id)}`,
    `  •••• ${or(c.last4)} · ${or(c.type)} · ${or(c.status)}`,
    `  account: ${or(c.accountId)}`,
    `  ${or(c.description)}`,
  ].join("\n")
}

export function formatEntity(e: Entity): string {
  return [
    `Entity ${or(e.id)}`,
    `  ${or(e.name)} · ${or(e.entityType)} · ${or(e.status)}`,
    `  email: ${or(e.email)}`,
  ].join("\n")
}

export function formatLimit(l: Limit): string {
  return [
    `Limit ${or(l.id)}`,
    `  ${or(l.name)} · ${or(l.type)} · ${or(l.interval)}`,
    `  amount: ${formatCents(l.amount)} · status: ${or(l.status)}`,
  ].join("\n")
}

export function formatRoutingNumber(r: RoutingNumber): string {
  return `${or(r.routingNumber)} · ${or(r.name)} · funds transfer: ${or(r.fundsTransfer)}`
}

export function formatEvent(e: Event): string {
  return `${or(e.createdAt)} · ${or(e.type)} · object ${or(e.associatedObjectId)} · ${or(e.category)}`
}

export function formatStatement(s: AccountStatement): string {
  return [
    `Statement ${or(s.id)}`,
    `  account: ${or(s.accountId)}`,
    `  period: ${or(s.statementPeriodStart)} → ${or(s.statementPeriodEnd)}`,
  ].join("\n")
}

export function formatList<T>(page: Paged<T>, format: (item: T) => string, empty: string): string {
  if (page.data.length === 0) return empty
  const body = page.data.map((item, index) => `${index + 1}. ${format(item)}`).join("\n")
  const cursor = page.nextCursor ? `\n\nnext_cursor: ${page.nextCursor}` : ""
  return `${page.data.length} result(s)\n\n${body}${cursor}`
}
