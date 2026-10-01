export class MercuryError extends Error {
  constructor(message: string) {
    super(message)
    this.name = "MercuryError"
  }
}

export function errorMessage(e: unknown): string {
  return e instanceof Error ? e.message : String(e)
}

const UA = { "User-Agent": "awesome-mcps/1.0" };
const BASE = "https://api.mercury.com/api/v1";

function headers(): Record<string, string> {
  const k = process.env.MERCURY_API_KEY;
  if (!k) throw new MercuryError("Set MERCURY_API_KEY (Mercury sandbox).");
  return { ...UA, Accept: "application/json", Authorization: `Bearer ${k}` };
}

async function get(path: string): Promise<string> {
  let res: Response;
  try {
    res = await fetch(BASE + path, { signal: AbortSignal.timeout(30000), headers: headers() });
  } catch (e) {
    throw new MercuryError(`Network error: ${(e as Error).message}`);
  }
  if (!res.ok) {
    const body = (await res.text()).slice(0, 300);
    throw new MercuryError(`HTTP ${res.status}: ${body}`);
  }
  return res.text();
}

export function listAccounts(): Promise<string> {
  return get("/accounts");
}

export function getAccount(accountId: string): Promise<string> {
  return get(`/account/${encodeURIComponent(accountId)}`);
}

export function listTransactions(accountId: string, limit?: string): Promise<string> {
  const n = Math.min(Number(limit ?? 20) || 20, 100);
  return get(`/account/${encodeURIComponent(accountId)}/transactions?limit=${n}`);
}

// ---- muxF tools:
/**
 * Mercury is a banking API that needs a key. The FDIC's own BankFind data is
 * public and keyless, and it is the same subject matter: US depository
 * institutions and their call report numbers.
 */
const FDIC = "https://api.fdic.gov/banks";

interface FdicEnvelope<T> {
  meta?: { total?: number };
  data?: T[];
}

interface FdicInstitution {
  NAME?: string;
  CERT?: number;
  CITY?: string;
  STALP?: string;
  ASSET?: number;
  DEP?: number;
  NETINC?: number;
  ROA?: number;
  ROE?: number;
  ESTYMD?: string;
  ACTIVE?: number | string;
  CLASS?: string;
  INSAGNT1?: string;
  STNAME?: string;
  SUBCHAPS?: string;
}

interface FdicFinancials {
  CERT?: number;
  REPDTE?: string;
  ASSET?: number;
  DEP?: number;
  NETINC?: number;
  ROA?: number;
  ROE?: number;
  NIMY?: number;
  NPTLA?: number;
  EQ?: number;
  PERTO?: number;
  LNLSNET?: number;
  ID?: string;
}

async function fdicJson<T>(path: string, what: string): Promise<FdicEnvelope<T>> {
  let res: Response;
  try {
    res = await fetch(`${FDIC}${path}${path.includes("?") ? "&" : "?"}format=json`, {
      headers: { ...UA, Accept: "application/json" },
      signal: AbortSignal.timeout(30000),
    });
  } catch (e) {
    throw new MercuryError(`Network error: ${(e as Error).message}`);
  }
  if (res.status === 404) throw new MercuryError(`The FDIC has no ${what}.`);
  if (!res.ok) throw new MercuryError(`The FDIC API returned HTTP ${res.status} for ${what}.`);
  const body = (await res.text()).trim();
  if (!body) throw new MercuryError(`The FDIC API returned an empty body for ${what}.`);
  return JSON.parse(body) as FdicEnvelope<T>;
}

// The FDIC wraps each hit in a scored envelope, so unwrap before reading fields.
const fdicRow = <T>(item: unknown): T | null => {
  if (!item || typeof item !== "object") return null;
  const record = item as { data?: T };
  if (record.data && typeof record.data === "object") return record.data;
  return item as T;
};

const fdicMoney = (thousands: unknown): string => {
  const value = Number(thousands);
  if (!Number.isFinite(value)) return "not reported";
  const dollars = value * 1000;
  if (Math.abs(dollars) >= 1e9) return `$${(dollars / 1e9).toFixed(2)}bn`;
  if (Math.abs(dollars) >= 1e6) return `$${(dollars / 1e6).toFixed(1)}m`;
  return `$${Math.round(dollars).toLocaleString("en-US")}`;
};

const fdicPct = (value: unknown): string => {
  const n = Number(value);
  return Number.isFinite(n) ? `${n.toFixed(2)}%` : "not reported";
};

/** Find the US banks whose name matches, straight out of the FDIC's own data. */
export async function fdicInstitutionSearch(args: { name: string; limit?: number; state?: string }): Promise<string> {
  const term = String(args?.name ?? "").trim().replace(/[^\w .-]/g, " ");
  if (term.length < 2) throw new MercuryError("Give at least two letters of the bank's name.");
  const n = Math.min(Math.max(Number(args?.limit ?? 8) || 8, 1), 20);
  const state = String(args?.state ?? "").trim().toUpperCase();
  const filters = [`NAME:*${term}*`];
  if (/^[A-Z]{2}$/.test(state)) filters.push(`STALP:${state}`);
  const fields = "NAME,CERT,CLASS,INSAGNT1,CITY,STALP,STNAME,ASSET,DEP,NETINC,ROA,ROE,ESTYMD,ACTIVE";

  const data = await fdicJson<FdicInstitution>(
    `/institutions?filters=${encodeURIComponent(filters.join(" AND "))}&fields=${fields}&sort_by=ASSET&sort_order=DESC&limit=${n}`,
    `institution matching "${term}"`,
  );
  const rows = (data.data ?? []).map((item) => fdicRow<FdicInstitution>(item)).filter((row): row is FdicInstitution => row !== null);
  if (!rows.length) throw new MercuryError(`No FDIC institution matches "${term}"${state ? ` in ${state}` : ""}.`);

  const lines = [
    `FDIC institutions matching "${term}"${state ? ` in ${state}` : ""}: ${data.meta?.total ?? rows.length} on file, showing ${rows.length} by total assets`,
    "Figures are the FDIC's own fields: assets, deposits and net income in thousands of dollars.",
    "",
    "  name                                        cert  class    location            assets      deposits    ROA      ROE      since",
  ];
  for (const row of rows) {
    const active = row.ACTIVE === 1 || row.ACTIVE === "1" ? "" : " [inactive]";
    lines.push(
      `  ${String(row.NAME ?? "not reported").slice(0, 42).padEnd(43)}${String(row.CERT ?? "-").padEnd(6)}${String(row.CLASS ?? "-").slice(0, 8).padEnd(9)}${`${row.CITY ?? "?"}, ${row.STALP ?? "??"}`.padEnd(19)}${fdicMoney(row.ASSET).padEnd(11)}${fdicMoney(row.DEP).padEnd(12)}${fdicPct(row.ROA).padEnd(9)}${fdicPct(row.ROE).padEnd(9)}${String(row.ESTYMD ?? "not reported").slice(0, 10)}${active}`,
    );
  }
  const total = rows.reduce((sum, row) => sum + (Number(row.ASSET) || 0), 0);
  lines.push("");
  lines.push(`  Those ${rows.length} institutions hold ${fdicMoney(total)} of assets between them.`);
  lines.push(`  Insured by ${rows[0]?.INSAGNT1 ?? "not reported"}; a CERT is the FDIC's own institution number.`);
  return lines.join("\n");
}

/** Put several banks side by side from one quarter of call report data. */
export async function fdicCallReportCompare(args: { certs: string; repdte?: string }): Promise<string> {
  const certs = String(args?.certs ?? "")
    .split(/[\s,]+/)
    .map((s) => s.trim())
    .filter((s) => /^\d{1,6}$/.test(s))
    .slice(0, 6);
  if (!certs.length) throw new MercuryError("Give one to six FDIC certificate numbers, e.g. 628 3519.");
  const quarter = String(args?.repdte ?? "").trim() || "20260630";
  if (!/^\d{8}$/.test(quarter)) throw new MercuryError("Give the report date as YYYYMMDD, e.g. 20260630.");

  const rows: Array<{ cert: string; fin: FdicFinancials | null; name: string }> = [];
  for (const cert of certs) {
    const [fin, inst] = await Promise.all([
      fdicJson<FdicFinancials>(
        `/financials?filters=${encodeURIComponent(`CERT:${cert} AND REPDTE:${quarter}`)}&fields=CERT,REPDTE,ASSET,DEP,NETINC,ROA,ROE,NIMY,NPTLA,EQ,PERTO&limit=1`,
        `call report for cert ${cert}`,
      ).catch(() => ({ data: [] } as FdicEnvelope<FdicFinancials>)),
      fdicJson<FdicInstitution>(
        `/institutions?filters=${encodeURIComponent(`CERT:${cert}`)}&fields=NAME,STALP,CITY&limit=1`,
        `institution for cert ${cert}`,
      ).catch(() => ({ data: [] } as FdicEnvelope<FdicInstitution>)),
    ]);
    const finRow = fin.data?.[0] ? fdicRow<FdicFinancials>(fin.data[0]) : null;
    const instRow = inst.data?.[0] ? fdicRow<FdicInstitution>(inst.data[0]) : null;
    rows.push({
      cert,
      fin: finRow,
      name: instRow?.NAME ? String(instRow.NAME) : `cert ${cert}`,
    });
  }
  const withData = rows.filter((row) => row.fin);
  if (!withData.length) throw new MercuryError(`The FDIC has no call report for ${quarter} for any of those certificate numbers.`);

  const lines = [`FDIC call report comparison for ${quarter.slice(0, 4)}-${quarter.slice(4, 6)}-${quarter.slice(6, 8)}`];
  for (const row of rows) lines.push(`  cert ${row.cert} (${row.name}): ${row.fin ? `reported` : "no data for that quarter"}`);
  lines.push("");
  lines.push("  cert  name                          assets      deposits   net income   equity     loans/dep  ROA      ROE      NIM");
  for (const row of withData) {
    const f = row.fin!;
    const loans = Number(f.NPTLA);
    const deposits = Number(f.DEP);
    const ltd = Number.isFinite(loans) && deposits > 0 ? `${((loans / deposits) * 100).toFixed(1)}%` : "not reported";
    lines.push(
      `  ${String(f.CERT ?? row.cert).padEnd(6)}${row.name.slice(0, 29).padEnd(30)}${fdicMoney(f.ASSET).padEnd(11)}${fdicMoney(f.DEP).padEnd(11)}${fdicMoney(f.NETINC).padEnd(13)}${fdicMoney(f.EQ).padEnd(11)}${ltd.padEnd(11)}${fdicPct(f.ROA).padEnd(9)}${fdicPct(f.ROE).padEnd(9)}${fdicPct(f.NIMY)}`,
    );
  }
  const biggest = [...withData].sort((a, b) => (Number(b.fin!.ASSET) || 0) - (Number(a.fin!.ASSET) || 0))[0];
  lines.push("");
  lines.push(`  Largest of the set: cert ${biggest?.fin?.CERT} at ${fdicMoney(biggest?.fin?.ASSET)} of assets.`);
  lines.push("  Loans/deposits is computed from the reported net loans and total deposits; NIM is net interest margin as the FDIC reports it.");
  return lines.join("\n");
}
