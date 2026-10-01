export class PlaidError extends Error {
  constructor(message: string) {
    super(message)
    this.name = "PlaidError"
  }
}

export function errorMessage(e: unknown): string {
  return e instanceof Error ? e.message : String(e)
}

const UA = { "User-Agent": "awesome-mcps/1.0" };

function creds(): { id: string; secret: string } {
  const id = process.env.PLAID_CLIENT_ID;
  const secret = process.env.PLAID_SECRET;
  if (!id || !secret) throw new PlaidError("Set PLAID_CLIENT_ID and PLAID_SECRET (Plaid sandbox).");
  return { id, secret };
}

async function post(path: string, extra: Record<string, unknown> = {}): Promise<string> {
  const { id, secret } = creds();
  let res: Response;
  try {
    res = await fetch("https://sandbox.plaid.com" + path, {
      method: "POST",
      headers: { ...UA, Accept: "application/json", "Content-Type": "application/json", "PLAID-CLIENT-ID": id, "PLAID-SECRET": secret },
      body: JSON.stringify(extra),
      signal: AbortSignal.timeout(25000),
    });
  } catch (e) {
    throw new PlaidError(`Network error: ${(e as Error).message}`);
  }
  const text = await res.text();
  if (!res.ok) throw new PlaidError(`HTTP ${res.status}: ${text.slice(0, 300)}`);
  return text.slice(0, 8000);
}

export function listInstitutions(count?: string): Promise<string> {
  const n = Math.min(Number(count ?? 10) || 10, 100);
  return post("/institutions/search", { query: "bank", products: ["transactions"], country_codes: ["US"], options: { include_optional_metadata: false } }).then((t) => {
    try {
      const d = JSON.parse(t) as { institutions?: unknown[] };
      return JSON.stringify((d.institutions ?? []).slice(0, n), null, 2);
    } catch {
      return t.slice(0, 4000);
    }
  });
}

export function listCategories(): Promise<string> {
  return post("/categories/get", {});
}

export function sandboxToken(institutionId?: string): Promise<string> {
  return post("/sandbox/public_token/create", {
    institution_id: institutionId ?? "ins_109508",
    initial_products: ["transactions"],
  });
}

export function getInstitution(institutionId: string): Promise<string> {
  return post("/institutions/get_by_id", { institution_id: institutionId });
}

export function sandboxBalance(accessToken: string): Promise<string> {
  return post("/accounts/balance/get", { access_token: accessToken });
}

export function sandboxTransactions(accessToken: string, days?: string): Promise<string> {
  const d = Math.min(Number(days ?? 30) || 30, 730);
  const end = new Date().toISOString().slice(0, 10);
  const start = new Date(Date.now() - d * 86400000).toISOString().slice(0, 10);
  return post("/transactions/sync", { access_token: accessToken, count: 20 }).then((t) => t.slice(0, 12000));
}

export function sandboxHoldings(accessToken: string): Promise<string> {
  return post("/investments/holdings/get", { access_token: accessToken });
}

export function sandboxLiabilities(accessToken: string): Promise<string> {
  return post("/liabilities/get", { access_token: accessToken });
}

export function sandboxAuth(accessToken: string): Promise<string> {
  return post("/auth/get", { access_token: accessToken });
}

export function sandboxIdentity(accessToken: string): Promise<string> {
  return post("/identity/get", { access_token: accessToken });
}

// ---- muxH tools:
// Every tool above needs Plaid credentials and reads a sandbox account. The
// FDIC publishes the call reports every US bank files, keylessly, so these
// tools answer "how healthy is that institution" without any account at all.

const FDIC = "https://api.fdic.gov/banks"
const FDIC_UA = "plaid-mcp/1.2 (https://github.com/mrfentmen/plaid-mcp)"

interface FdciResponse {
  meta?: { total?: number; index?: { name?: string; createTimestamp?: string } }
  data?: Array<{ data?: Record<string, unknown> }>
  totals?: { count?: number }
}

const fdciRows = (body: FdciResponse): Record<string, unknown>[] =>
  Array.isArray(body.data) ? body.data.map((row) => row?.data ?? {}).filter((row) => Object.keys(row).length > 0) : []

async function fdciGet<T>(path: string): Promise<T> {
  const res = await fetch(`${FDIC}${path}`, {
    headers: { Accept: "application/json", "User-Agent": FDIC_UA },
    signal: AbortSignal.timeout(25000),
  })
  if (res.status === 400) throw new PlaidError("The FDIC rejected the query. Check the certificate number or field names.")
  if (!res.ok) throw new PlaidError(`FDIC BankFind API error ${res.status}: ${res.statusText}`)
  return (await res.json()) as T
}

const usd = (value: unknown): string => {
  const n = Number(value)
  if (!Number.isFinite(n)) return "not reported"
  if (Math.abs(n) >= 1e9) return `$${(n / 1e9).toLocaleString(undefined, { maximumFractionDigits: 2 })}B`
  if (Math.abs(n) >= 1e6) return `$${(n / 1e6).toLocaleString(undefined, { maximumFractionDigits: 1 })}M`
  return `$${n.toLocaleString(undefined, { maximumFractionDigits: 0 })}`
}

const cleanDate = (value: unknown): string => {
  const raw = String(value ?? "")
  if (/^\d{8}$/.test(raw)) return `${raw.slice(0, 4)}-${raw.slice(4, 6)}-${raw.slice(6, 8)}`
  if (/^\d{2}\/\d{2}\/\d{4}$/.test(raw)) {
    const [m, d, y] = raw.split("/")
    return `${y}-${m}-${d}`
  }
  return raw || "not reported"
}

const CERT_FIELDS = "CERT,NAME,CITY,STALP,ASSET,DEP,ESTYMD,REPDTE,ACTIVE,REGAGNT,SPECIALIZ,CLASSBK,INTLNET"

/**
 * Find a US bank by name and report its call-report basics: where it is, when
 * it was founded, its total assets and deposits, and its regulator.
 */
export async function findBank(args: { name: string; limit?: number }): Promise<string> {
  const name = (args.name ?? "").trim()
  if (name.length < 2) throw new PlaidError("Give at least two characters of the bank's name.")
  const size = Math.min(Math.max(Math.trunc(args.limit ?? 5), 1), 20)
  const body = await fdciGet<FdciResponse>(
    `/institutions?search=NAME:%22${encodeURIComponent(name)}%22&fields=${CERT_FIELDS}&limit=${size}&format=json`
  )
  const rows = fdciRows(body)
  if (!rows.length) throw new PlaidError(`The FDIC call-report database has no institution matching "${name}".`)

  return [
    `US banks matching "${name}" (${body.totals?.count ?? rows.length} in the database, showing ${rows.length})`,
    "",
    ...rows.map((row, i) =>
      [
        `${String(i + 1).padStart(2)}. ${String(row.NAME ?? "unnamed")} — certificate ${String(row.CERT ?? "not reported")}`,
        `    ${String(row.CITY ?? "city not reported")}, ${String(row.STALP ?? "state not reported")} | founded ${String(row.ESTYMD ?? "not reported")}`,
        `    assets ${usd(row.ASSET)} | deposits ${usd(row.DEP)} | report date ${cleanDate(row.REPDTE)}`,
        `    regulator ${String(row.REGAGNT ?? "not reported")} | international banking facility ${row.INTLNET === 1 ? "yes" : "no"} | primary depositor ${row.SPECIALIZ === 1 ? "yes" : "no"}`,
      ].join("\n")
    ),
    "",
    "Source: FDIC BankFind call report data, a public dataset.",
  ].join("\n")
}

