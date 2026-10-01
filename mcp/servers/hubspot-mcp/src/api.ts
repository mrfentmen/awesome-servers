export class HubspotError extends Error {
  constructor(message: string) {
    super(message)
    this.name = "HubspotError"
  }
}

export function errorMessage(e: unknown): string {
  return e instanceof Error ? e.message : String(e)
}

const UA = { "User-Agent": "awesome-mcps/1.0" };

function headers(): Record<string, string> {
  const k = process.env.HUBSPOT_ACCESS_TOKEN;
  if (!k) throw new HubspotError("Set HUBSPOT_ACCESS_TOKEN (HubSpot private app).");
  return { ...UA, Accept: "application/json", Authorization: `Bearer ${k}` };
}

async function get(path: string): Promise<string> {
  let res: Response;
  try {
    res = await fetch("https://api.hubapi.com" + path, {
      headers: headers(),
      signal: AbortSignal.timeout(25000),
    });
  } catch (e) {
    throw new HubspotError(`Network error: ${(e as Error).message}`);
  }
  if (!res.ok) {
    const body = (await res.text()).slice(0, 300);
    throw new HubspotError(`HTTP ${res.status}: ${body}`);
  }
  return (await res.text()).slice(0, 12000);
}

export function listContacts(limit?: string): Promise<string> {
  const n = Math.min(Number(limit ?? 10) || 10, 100);
  return get(`/crm/v3/objects/contacts?limit=${n}`);
}

export function listCompanies(limit?: string): Promise<string> {
  const n = Math.min(Number(limit ?? 10) || 10, 100);
  return get(`/crm/v3/objects/companies?limit=${n}`);
}

export function listDeals(limit?: string): Promise<string> {
  const n = Math.min(Number(limit ?? 10) || 10, 100);
  return get(`/crm/v3/objects/deals?limit=${n}`);
}



export function listTickets(limit?: string): Promise<string> {
  const n = Math.min(Number(limit ?? 10) || 10, 100);
  return get(`/crm/v3/objects/tickets?limit=${n}`);
}

export function listOwners(): Promise<string> {
  return get("/crm/v3/owners?limit=50");
}

export function getContact(contactId: string): Promise<string> {
  return get(`/crm/v3/objects/contacts/${encodeURIComponent(contactId)}`);
}

export function getCompany(companyId: string): Promise<string> {
  return get(`/crm/v3/objects/companies/${encodeURIComponent(companyId)}`);
}

export function getDeal(dealId: string): Promise<string> {
  return get(`/crm/v3/objects/deals/${encodeURIComponent(dealId)}`);
}

export function searchContacts(email: string): Promise<string> {
  return (async () => {
    let res: Response;
    try {
      res = await fetch("https://api.hubapi.com/crm/v3/objects/contacts/search", {
        method: "POST",
        headers: { ...UA, Accept: "application/json", "Content-Type": "application/json", Authorization: `Bearer ${process.env.HUBSPOT_ACCESS_TOKEN}` },
        body: JSON.stringify({ filterGroups: [{ filters: [{ propertyName: "email", operator: "EQ", value: email }] }], limit: 5 }),
        signal: AbortSignal.timeout(25000),
      });
    } catch (e) {
      throw new HubspotError(`Network error: ${(e as Error).message}`);
    }
    const text = await res.text();
    if (!res.ok) throw new HubspotError(`HTTP ${res.status}: ${text.slice(0, 300)}`);
    return text.slice(0, 8000);
  })();
}

export function dealPipelines(): Promise<string> {
  return get("/crm/v3/pipelines/deals");
}

// ---- muxG tools:
const SEC_TICKERS = "https://www.sec.gov/files/company_tickers.json"
const SEC_SUBMISSIONS = "https://data.sec.gov/submissions"
const GLEIF = "https://api.gleif.org/api/v1/lei-records"

const SEC_UA = { "User-Agent": "mrfentmen-hubspot-mcp/1.0", Accept: "application/json" }

interface GleifEntity {
  legalName?: { name?: string; language?: string };
  legalAddress?: {
    addressLines?: string[];
    city?: string;
    region?: string;
    country?: string;
    postalCode?: string;
  };
  registeredAddress?: { country?: string; city?: string };
  otherNames?: Array<{ name?: string; language?: string }>;
}

interface GleifRecord {
  id?: string;
  attributes?: {
    lei?: string;
    entity?: GleifEntity;
    status?: string;
    registration?: { id?: string; status?: string; initialRegistrationDate?: string; lastUpdateDate?: string };
    entityType?: string;
    headquarters?: { country?: string; city?: string };
  };
}

async function hubspotJson<T>(url: string, headers: Record<string, string>): Promise<T> {
  const res = await fetch(url, { headers, signal: AbortSignal.timeout(25000) });
  if (res.status === 403 || res.status === 429) throw new Error(`Upstream returned ${res.status} (rate limited); SEC asks for a slower caller, so wait and retry.`);
  if (!res.ok) throw new Error(`Upstream returned ${res.status}`);
  const text = await res.text();
  if (!text.trim()) throw new Error("Upstream returned an empty body.");
  return JSON.parse(text) as T;
}

const addressOf = (entity: GleifEntity | undefined): string => {
  const address = entity?.legalAddress;
  if (!address) return "address not reported";
  return [address.addressLines?.join(" "), address.postalCode, address.city, address.region, address.country]
    .filter((part) => typeof part === "string" && part)
    .join(", ") || "address not reported";
};

/** Is this a company, and where is it legally registered? From the GLEIF legal entity index. */
export async function legalEntityLookup(args: { name: string; limit?: number }): Promise<string> {
  const name = String(args?.name ?? "").trim();
  if (!name) throw new Error("Provide a company name, for example Stripe.");
  const n = Math.min(Math.max(Number(args?.limit ?? 5) || 5, 1), 20);
  const url = `${GLEIF}?filter[entity.legalName]=${encodeURIComponent(name)}&page[size]=${n}`;
  const data = await hubspotJson<{ meta?: { pagination?: { total?: number } }; data?: GleifRecord[] }>(url, {
    "User-Agent": "mrfentmen-hubspot-mcp/1.0",
    Accept: "application/json",
  });
  const rows = Array.isArray(data.data) ? data.data : [];
  if (!rows.length) return `The GLEIF legal entity index has no record for "${name}".`;

  const total = data.meta?.pagination?.total ?? rows.length;
  const lines = [`GLEIF legal entity records matching "${name}": ${total} found, showing ${rows.length}`];
  for (const [i, record] of rows.entries()) {
    const attributes = record.attributes ?? {};
    const entity = attributes.entity;
    const others = (entity?.otherNames ?? []).map((o) => o.name).filter(Boolean).slice(0, 3);
    lines.push(`  ${i + 1}. ${entity?.legalName?.name ?? "legal name not reported"} - LEI ${attributes.lei ?? record.id ?? "not reported"} - status ${attributes.status ?? "not reported"}`);
    lines.push(`     registered: ${addressOf(entity)}`);
    if (attributes.headquarters?.country) lines.push(`     headquarters country ${attributes.headquarters.country}${attributes.headquarters.city ? ` (${attributes.headquarters.city})` : ""}`);
    if (attributes.registration?.initialRegistrationDate) {
      lines.push(`     LEI registered ${String(attributes.registration.initialRegistrationDate).slice(0, 10)}${attributes.registration.lastUpdateDate ? ` · last updated ${String(attributes.registration.lastUpdateDate).slice(0, 10)}` : ""}`);
    }
    if (others.length) lines.push(`     also known as: ${others.join("; ")}`)
  }
  return lines.join("\n");
}

interface SecSubmission {
  cik?: string;
  name?: string;
  sic?: string;
  sicDescription?: string;
  ein?: string;
  stateOfIncorporation?: string;
  fiscalYearEnd?: string;
  category?: string;
  entityType?: string;
  tickers?: string[];
  exchanges?: string[];
  formerNames?: Array<{ name?: string; from?: string; to?: string }>;
  filings?: { recent?: Record<string, string[]> };
}

/** Is this an SEC registrant, what industry does the SEC file it under, and what has it filed lately? */
export async function secCompany(args: { name: string; limit?: number }): Promise<string> {
  const name = String(args?.name ?? "").trim();
  if (!name) throw new Error("Provide a company name or a ticker, for example Apple or AAPL.");
  const n = Math.min(Math.max(Number(args?.limit ?? 5) || 5, 1), 30);
  const wanted = name.toLowerCase();

  const table = await hubspotJson<Record<string, { cik_str?: number; ticker?: string; title?: string }>>(SEC_TICKERS, SEC_UA);
  const rows = Object.values(table ?? {}).filter((row) => typeof row?.cik_str === "number");
  const scored = rows
    .map((row) => {
      const title = String(row.title ?? "");
      const ticker = String(row.ticker ?? "");
      let score = -1;
      if (ticker.toLowerCase() === wanted) score = 0;
      else if (title.toLowerCase() === wanted) score = 1;
      else if (title.toLowerCase().startsWith(wanted)) score = 2;
      else if (title.toLowerCase().includes(wanted)) score = 3;
      return { row, score };
    })
    .filter((entry) => entry.score >= 0)
    .sort((a, b) => a.score - b.score);

  if (!scored.length) return `No SEC registrant matches "${name}" by ticker or company name.`;
  const cik = String(scored[0].row.cik_str).padStart(10, "0");
  const data = await hubspotJson<SecSubmission>(`${SEC_SUBMISSIONS}/CIK${cik}.json`, SEC_UA);
  if (!data || !data.name) throw new Error(`The SEC submissions service returned no record for CIK ${cik}.`);

  const recent = data.filings?.recent ?? {};
  const forms = recent.form ?? [];
  const dates = recent.filingDate ?? [];
  const accessions = recent.accessionNumber ?? [];
  const forms4 = forms.filter((form) => form === "4" || form === "144").length;
  const notable = forms.filter((form) => /^(10-K|10-Q|8-K|S-1|20-F|DEF 14A)$/.test(form));

  const lines = [
    `${data.name} - SEC CIK ${data.cik ?? cik}${data.tickers?.length ? ` (${data.tickers.join(", ")}${data.exchanges?.length ? ` on ${data.exchanges.join(", ")}` : ""})` : ""}`,
    `SIC ${data.sic ?? "not reported"} - ${data.sicDescription ?? "description not reported"}`,
    `State of incorporation ${data.stateOfIncorporation ?? "not reported"} · fiscal year ends ${data.fiscalYearEnd ?? "not reported"} · filer category ${data.category ?? "not reported"} · entity type ${data.entityType ?? "not reported"}`,
  ];
  const former = (data.formerNames ?? []).map((f) => f.name).filter(Boolean).slice(0, 4);
  if (former.length) lines.push(`Former names: ${former.join("; ")}`)
  lines.push(`Match confidence: ${["exact ticker", "exact company name", "company name prefix", "company name contains"][scored[0].score]} (of ${scored.length} candidate(s) in the SEC ticker file).`);

  lines.push("");
  lines.push(`Recent filings on file: ${forms.length} (${notable.length} periodic or current reports, ${forms4} ownership forms 4/144)`);
  const picked: number[] = [];
  for (const [i, form] of forms.entries()) {
    if (/^(10-K|10-Q|8-K|S-1|20-F|DEF 14A)$/.test(form) && picked.length < n) picked.push(i);
  }
  for (const [i, index] of picked.entries()) {
    const accession = (accessions[index] ?? "").replace(/-/g, "");
    lines.push(`  ${i + 1}. ${forms[index]} filed ${dates[index] ?? "date not reported"} · accession ${accessions[index] ?? "not reported"}`);
    lines.push(`     https://www.sec.gov/Archives/edgar/data/${Number(cik)}/${accession}/`);
  }
  if (!picked.length) lines.push("  No periodic or current report appears in the recent filings window.");
  return lines.join("\n");
}
