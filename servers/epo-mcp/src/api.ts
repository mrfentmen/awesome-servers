export class EpoError extends Error {
  constructor(message: string) {
    super(message)
    this.name = "EpoError"
  }
}

export function errorMessage(e: unknown): string {
  return e instanceof Error ? e.message : String(e)
}

const UA = { "User-Agent": "awesome-mcps/1.0" };

let cached: { token: string; expiresAt: number } | null = null;

function creds(): { key: string; secret: string } {
  const key = process.env.EPO_CONSUMER_KEY;
  const secret = process.env.EPO_CONSUMER_SECRET;
  if (!key || !secret) throw new EpoError("Set EPO_CONSUMER_KEY and EPO_CONSUMER_SECRET (free EPO registration).");
  return { key, secret };
}

async function token(): Promise<string> {
  const { key, secret } = creds();
  if (cached && Date.now() < cached.expiresAt) return cached.token;
  let res: Response;
  try {
    res = await fetch("https://ops.epo.org/3.2/auth/accesstoken", {
      method: "POST",
      headers: { ...UA, "Content-Type": "application/x-www-form-urlencoded", Authorization: `Basic ${Buffer.from(`${key}:${secret}`).toString("base64")}` },
      body: "grant_type=client_credentials",
      signal: AbortSignal.timeout(25000),
    });
  } catch (e) {
    throw new EpoError(`Network error: ${(e as Error).message}`);
  }
  if (!res.ok) {
    const body = (await res.text()).slice(0, 300);
    throw new EpoError(`Token error HTTP ${res.status}: ${body}`);
  }
  const d = (await res.json()) as { access_token?: string; expires_in?: number };
  if (!d.access_token) throw new EpoError("Token error: no access_token.");
  cached = { token: d.access_token, expiresAt: Date.now() + (d.expires_in ?? 1200) * 1000 - 60000 };
  return d.access_token;
}

async function get(path: string): Promise<string> {
  const t = await token();
  let res: Response;
  try {
    res = await fetch("https://ops.epo.org/3.2/rest-services" + path, {
      headers: { ...UA, Accept: "application/json", Authorization: `Bearer ${t}` },
      signal: AbortSignal.timeout(25000),
    });
  } catch (e) {
    throw new EpoError(`Network error: ${(e as Error).message}`);
  }
  if (!res.ok) {
    const body = (await res.text()).slice(0, 300);
    throw new EpoError(`HTTP ${res.status}: ${body}`);
  }
  return (await res.text()).slice(0, 12000);
}

export function search(query: string, range?: string): Promise<string> {
  const r = range ?? "1-10";
  return get(`/published-data/search?q=${encodeURIComponent(query)}&Range=${encodeURIComponent(r)}`);
}

export function family(country: string, number: string, kind: string): Promise<string> {
  return get(`/family/publication/docdb/${encodeURIComponent(country)}.${encodeURIComponent(number)}.${encodeURIComponent(kind)}/`);
}

// ---- muxD tools:

/**
 * OPS 3.2 serialises its XML model as JSON in a way that makes key lookup
 * treacherous: every element name carries an "ops:" prefix, XML attributes are
 * keys with an "@" prefix, the real value of a name is buried under
 * ops:translation/ops:name, and a repeated element is a wrapper object whose one
 * child has the same name as the wrapper and holds the array. Querying that
 * shape directly returns plausible-looking wrong answers, so it is normalised
 * once into plain keys with attributes and translations hoisted and repeated
 * elements flattened to arrays.
 */
function normalise(node: unknown): unknown {
  if (Array.isArray(node)) return node.map(normalise);
  if (node === null || typeof node !== "object") return node;

  const raw = node as Record<string, unknown>;
  const keys = Object.keys(raw);

  if (keys.length === 1) {
    const outer = stripPrefix(keys[0]);
    const inner = raw[keys[0]];
    // A repeated element serialises as a single-key wrapper holding an array.
    if (Array.isArray(inner)) return normalise(inner);
    // A scalar field serialises as a same-named wrapper: country -> {country: x}.
    if (inner && typeof inner === "object") {
      const innerKeys = Object.keys(inner as Record<string, unknown>);
      if (innerKeys.length === 1 && stripPrefix(innerKeys[0]) === outer) {
        return normalise((inner as Record<string, unknown>)[innerKeys[0]]);
      }
    }
  }

  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(raw)) {
    const name = stripPrefix(k);
    if (name === "translation") {
      // The real value of a name or text is buried one level down; hoist it.
      const t = normalise(v);
      if (t && typeof t === "object" && !Array.isArray(t)) {
        for (const tk of Object.keys(t as Record<string, unknown>)) {
          if (tk === "name" || tk === "text") out[tk] = (t as Record<string, unknown>)[tk];
        }
      }
      continue;
    }
    out[name] = normalise(v);
  }
  return out;
}

const stripPrefix = (k: string): string => (k.startsWith("@") ? k.slice(1) : k.includes(":") ? k.slice(k.lastIndexOf(":") + 1) : k)

type Bag = Record<string, unknown>

const asBag = (v: unknown): Bag | undefined => (v && typeof v === "object" && !Array.isArray(v) ? (v as Bag) : undefined)
const asList = (v: unknown): unknown[] => (Array.isArray(v) ? v : v === undefined || v === null ? [] : [v])

/** All nodes stored under a normalised key name, at any depth. */
function valuesByKey(root: unknown, name: string): unknown[] {
  const out: unknown[] = []
  const visit = (n: unknown): void => {
    if (Array.isArray(n)) { for (const c of n) visit(c); return }
    if (!n || typeof n !== "object") return
    const bag = n as Bag
    for (const [k, v] of Object.entries(bag)) {
      if (k === name) out.push(v)
      else visit(v)
    }
  }
  visit(root)
  return out
}

/** First scalar stored under a normalised key name. */
function scalar(root: unknown, name: string): string | undefined {
  for (const v of valuesByKey(root, name)) {
    const found = unwrapScalar(v, 0)
    if (found !== undefined) return found
  }
  return undefined
}

/**
 * Looks through nested single-key wrappers. OPS wraps a value twice in places,
 * as main-group -> {value: 20} and as country -> {country: "US"}, and one pass
 * of normalise does not fully collapse them, so extraction unwraps here rather
 * than assuming the tree came out tidy.
 */
function unwrapScalar(v: unknown, depth: number): string | undefined {
  if (depth > 4) return undefined
  if (typeof v === "string" || typeof v === "number") return String(v)
  if (Array.isArray(v)) {
    for (const item of v) {
      const f = unwrapScalar(item, depth + 1)
      if (f !== undefined) return f
    }
    return undefined
  }
  if (v && typeof v === "object") {
    const bag = v as Bag
    for (const k of ["value", "code", "dtd", "text", "name"]) {
      if (k in bag) {
        const f = unwrapScalar(bag[k], depth + 1)
        if (f !== undefined) return f
      }
    }
    for (const inner of Object.values(bag)) {
      const f = unwrapScalar(inner, depth + 1)
      if (f !== undefined) return f
    }
  }
  return undefined
}

/** First node stored under a normalised key name, as an object. */
function node(root: unknown, name: string): Bag | undefined {
  for (const v of valuesByKey(root, name)) {
    const b = asBag(v)
    if (b) return b
  }
  return undefined
}

/**
 * OPS repeats every identifier as { country, doc-number, kind, date } both as a
 * nested document-id object and, for legal events, as flat children. This reads
 * either shape.
 */
function readDocRef(v: unknown): PubRef {
  const bag = asBag(v)
  if (!bag) return {}
  const did = asBag(bag["document-id"]) ?? bag
  const str = unwrapScalar
  return {
    country: str(did.country, 0) ?? str(bag.country, 0),
    number: str(did["doc-number"], 0) ?? str(bag["doc-number"], 0),
    kind: str(did.kind, 0) ?? str(bag.kind, 0),
    date: str(did.date, 0) ?? str(bag.date, 0),
  }
}

interface PubRef { country?: string; number?: string; kind?: string; date?: string }

const clean = (s?: string): string => (s ?? "").replace(/\s+/g, " ").trim()

/** A publication number is only usable if country, number and kind are all present. */
/** An application number carries no kind code, so it cannot be formatted as a publication reference. */
function fmtAppRef(r: PubRef): string {
  return r.country && r.number ? `${r.country}.${r.number}` : ""
}

function fmtRef(r: PubRef): string {
  if (!r.country || !r.number || !r.kind) return ""
  return `${r.country}.${r.number}.${r.kind}`
}

async function getJson(path: string): Promise<unknown> {
  const t = await token()
  let res: Response;
  try {
    res = await fetch("https://ops.epo.org/3.2/rest-services" + path, {
      headers: { ...UA, Accept: "application/json", Authorization: `Bearer ${t}` },
      signal: AbortSignal.timeout(30000),
    });
  } catch (e) {
    throw new EpoError(`Network error: ${(e as Error).message}`);
  }
  const body = await res.text();
  if (!res.ok) {
    throw new EpoError(`HTTP ${res.status}: ${body.slice(0, 300)}`);
  }
  try {
    return JSON.parse(body);
  } catch {
    throw new EpoError("EPO returned a body that is not JSON. OPS 3.2 can serve XML by default, so a JSON Accept header has to be honoured.");
  }
}

const splitRef = (country: string, number: string, kind: string): string => {
  const c = country.trim().toUpperCase();
  const n = number.trim();
  const k = kind.trim().toUpperCase();
  if (!/^[A-Z]{2}$/.test(c)) throw new EpoError(`"${country}" is not a two-letter country code, for example EP, WO, US or JP.`);
  if (!/^[0-9]+$/.test(n)) throw new EpoError(`"${number}" is not a publication number, which is digits only.`);
  if (!/^[A-Z][0-9]?$/.test(k)) throw new EpoError(`"${kind}" is not a kind code, for example A1, B2, A or B2.`);
  return `${c}.${n}.${k}`;
}

export interface PublicationRecordArgs {
  country: string;
  number: string;
  kind: string;
  include_abstract?: boolean;
}

/** The full publication document, where the existing search tool only returns a bibliographic hit list. */
export async function publicationRecord(args: PublicationRecordArgs): Promise<string> {
  const ref = splitRef(args.country, args.number, args.kind)
  const wantAbstract = args.include_abstract !== false
  const root = normalise(await getJson(`/published-data/publication/${ref}/`))

  const thisRef = fmtRef(readDocRef(valuesByKey(root, "publication-reference")[0]))
  const title = clean(scalar(root, "text") ?? "")
  const abstractText = wantAbstract ? clean(valuesByKey(root, "abstract").map((a) => scalar(a, "text") ?? "").filter(Boolean).join(" ")) : ""

  const applicantNames = valuesByKey(root, "applicant-name").map((a) => clean(scalar(a, "name") ?? "")).filter(Boolean)
  const inventorNames = valuesByKey(root, "inventor-name").map((a) => clean(scalar(a, "name") ?? "")).filter(Boolean)
  const applicantCountry = scalar(valuesByKey(root, "applicant")[0], "country")

  const appRef = readDocRef(valuesByKey(root, "application-reference")[0])
  const appRefStr = fmtAppRef(appRef)

  const priority = valuesByKey(root, "priority-claim").map((p) => {
    const pr = readDocRef(p)
    const date = scalar(p, "date")
    return pr.country && pr.number ? `${pr.country}.${pr.number}${date ? ` filed ${date}` : ""}` : ""
  }).filter(Boolean)

  const classifications: Array<{ scheme: string; symbol: string; sense: string }> = []
  const addClass = (c: unknown, scheme: string) => {
    const b = asBag(c)
    if (!b) return
    const symbol = [b.section, b.class, b.subclass, scalar(b, "main-group"), scalar(b, "subgroup")]
      .map((x) => (x === undefined ? "" : String(x)))
      .join("")
      .replace(/\s+/g, "")
    if (!symbol) return
    const sense = clean(String(asBag(b["classification-value"])?.value ?? ""))
    if (!classifications.some((x) => x.symbol === symbol && x.scheme === scheme)) classifications.push({ scheme, symbol, sense })
  }
  for (const c of valuesByKey(root, "classification-cpc")) for (const i of asList(c)) addClass(i, "CPC")
  for (const c of valuesByKey(root, "classification-ipcr")) for (const i of asList(c)) addClass(i, "IPC")

  const hasClaims = valuesByKey(root, "claims").length > 0
  const hasDescription = valuesByKey(root, "description").length > 0

  const lines = [
    `Publication record ${thisRef || ref}`,
    "",
    `Title: ${title || "not present in the response"}`,
    `Application: ${appRefStr || "not present"}${appRef.date ? `, filed ${appRef.date}` : ""}`,
    `Applicants: ${applicantNames.length ? applicantNames.join("; ") : "not present"}${applicantCountry ? ` (${applicantCountry})` : ""}`,
    `Inventors: ${inventorNames.length ? `${inventorNames.length} listed` : "not present"}${inventorNames.length && inventorNames.length <= 6 ? `: ${inventorNames.join("; ")}` : ""}`,
    `Priority: ${priority.length ? priority.join("; ") : "none claimed"}`,
    `Classification (${classifications.length}): ${classifications.length ? classifications.map((c) => `${c.scheme} ${c.symbol}${c.sense ? ` (${c.sense})` : ""}`).slice(0, 18).join("  ") : "none in the response"}`,
    `Claims text present: ${hasClaims ? "yes" : "no"}`,
    `Description text present: ${hasDescription ? "yes" : "no"}`,
  ]
  if (abstractText) lines.push("", `Abstract: ${abstractText.slice(0, 900)}${abstractText.length > 900 ? " \u2026" : ""}`)

  lines.push(
    "",
    "OPS 3.2 is a bibliographic service. Claims and description are only present for some publications and often only in part, and a no here means the document is not served, not that the patent has no claims.",
    "",
    "The classification symbols are the closest thing here to a technical summary: they index a real hierarchy, so the symbol plus its sense, where I marks the inventive contribution and A an additional one, tells you what the office considered novel.",
  )
  return lines.join("\n")
}

const INPADOC_EVENTS: Record<string, string> = {
  PLFP: "patent application published",
  PLBE: "patent specification published",
  PRS: "publication of the specification",
  PRS2: "publication of an amended specification",
  GRFP: "patent granted",
  INDP: "grant of patent",
  WD: "withdrawn",
  WDCL: "withdrawn by the applicant",
  CE: "cessation of the patent",
  PAA: "patent application abandoned",
  PA: "application withdrawn",
  ENDP: "end of the patent term",
  OPP: "opposition filed",
  APPL: "application submitted",
  REQ: "request received",
  FEE: "fee paid",
  DEFR: "deficiency",
  NPA: "application not published",
  PCT: "international application",
};

export interface LegalStatusArgs {
  country: string;
  number: string;
  kind: string;
  limit?: number;
}

/** The INPADOC legal event list, which is what answers whether a right is still live. */
export async function legalStatus(args: LegalStatusArgs): Promise<string> {
  const ref = splitRef(args.country, args.number, args.kind)
  const limit = Math.min(Math.max(Math.floor(args.limit ?? 40) || 40, 1), 200)
  const root = normalise(await getJson(`/published-data/legal/${ref}/`))

  const eventNodes = asList(valuesByKey(root, "legal-events")[0] ?? valuesByKey(root, "legal-event")[0])
  if (!eventNodes.length) {
    return [
      `Legal status for ${ref}`,
      "",
      "No legal events were returned.",
      "",
      "INPADOC builds this list from national registers and populates it only for publications the EPO tracks. An empty list usually means one of: the number is wrong, it is a very recent publication whose events have not propagated yet, or the jurisdiction does not feed INPADOC. It is not evidence that a patent is valid, expired or in force.",
    ].join("\n")
  }

  const events = eventNodes.map((n) => {
    const b = asBag(n) ?? {}
    const evDate = asBag(b["legal-event-date"])
    return {
      date: String(evDate?.dtd ?? b.dtd ?? ""),
      code: String(asBag(b["event-code"])?.code ?? b.code ?? ""),
      country: String(asBag(b.country)?.code ?? asBag(b.country)?.country ?? ""),
      note: clean(scalar(n, "event-subtype") ?? scalar(n, "digest") ?? ""),
    }
  })
  events.sort((a, b) => a.date.localeCompare(b.date))
  const shown = events.slice(0, limit)

  const codes = new Set(events.map((e) => e.code).filter(Boolean))
  const has = (c: string) => codes.has(c)
  const granted = has("GRFP") || has("INDP")
  const withdrawn = events.some((e) => e.code === "WD" || e.code === "WDCL" || e.code === "PAA" || e.code === "PA")
  const ceased = has("CE") || has("ENDP")
  const opposed = has("OPP")

  // A conclusion is stated only where the events support it outright. Anything
  // ambiguous stays a question, because a wrong "in force" is the costly error
  // for anyone making a freedom-to-operate decision.
  let verdict: string
  if (withdrawn) verdict = "Withdrawn or abandoned: the right was given up, so there is nothing in force to enforce."
  else if (ceased) verdict = "Cessation is recorded, so treat the right as no longer enforceable."
  else if (granted) verdict = "A grant event is present and no withdrawal or cessation appears, which is consistent with a right in force. Confirm on the register before relying on it."
  else verdict = "No grant event is present, so the right was never granted as far as INPADOC knows. The same appearance also covers an application whose events have not propagated, so pending and dead look identical here."

  const lines = [
    `Legal status for ${ref}: ${events.length} event(s)`,
    "",
    `Reading of the events: ${verdict}`,
    "",
    `${"date".padEnd(12)}${"code".padEnd(8)}meaning`,
  ]
  for (const e of shown) {
    const meaning = INPADOC_EVENTS[e.code] ?? "code not in the local table, shown verbatim"
    lines.push(`${(e.date || "?").padEnd(12)}${(e.code || "?").padEnd(8)}${meaning}${e.country ? ` [${e.country}]` : ""}${e.note ? ` \u2014 ${e.note.slice(0, 60)}` : ""}`)
  }
  if (events.length > limit) lines.push(`...and ${events.length - limit} more events; raise limit to see them.`)

  const unknown = [...codes].filter((c) => !INPADOC_EVENTS[c])
  if (unknown.length) {
    lines.push("")
    lines.push(`${unknown.length} event code(s) are not in this tool's table and are shown verbatim: ${unknown.slice(0, 12).join(", ")}. INPADOC defines a large code set, so treat the plain codes as the authoritative content.`)
  }
  if (opposed) {
    lines.push("An opposition event is present. An opposition either fails and the patent stands or succeeds and it is revoked, and an event code alone does not say which: a revocation shows up as a later event, so read the whole list before drawing a conclusion.")
  }
  lines.push(
    "",
    "This is INPADOC data assembled from national registers, not a legal opinion, and it lags the official registers by days to months. Only the EPO and national registers can state what is in force right now, or whether an opposition or appeal is pending. Use this to find the questions worth asking, then ask the register.",
  )
  return lines.join("\n")
}

const EPO_STEPS: Record<string, string> = {
  PA: "application filed", WWA: "written withdrawal", PAA: "application abandoned",
  PR: "publication of the specification", REQ: "examination requested", RR: "request to divide",
  CD: "communication to the applicant", OB: "opposition by the EPO",
  PBP: "publication of an amended specification", PAP: "amendment of the specification",
  CDPD: "communication under Art. 94(3)", TRF: "transfer", CIB: "information from the applicant",
  GR: "grant", CT: "certificate of transfer",
};

export interface EpoRegisterArgs {
  epodoc: string;
  limit?: number;
}

/** The EPO Register record itself, which is the authoritative source for a European filing. */
export async function epoRegister(args: EpoRegisterArgs): Promise<string> {
  const raw = String(args.epodoc ?? "").trim().replace(/^EP/i, "")
  if (!/^[0-9]{5,10}$/.test(raw)) {
    throw new EpoError(`"${args.epodoc}" is not an EP number. Use the digits of the EP application number, for example EP1234567 or 1234567.`)
  }
  const limit = Math.min(Math.max(Math.floor(args.limit ?? 30) || 30, 1), 200)
  const root = normalise(await getJson(`/register/publication/epodoc/${raw}/`))

  const appRef = readDocRef(valuesByKey(root, "application-reference")[0])
  const applicants = valuesByKey(root, "applicant").map((a) => {
    const name = clean(scalar(a, "name") ?? "")
    const country = scalar(a, "country")
    return name ? `${name}${country ? ` (${country})` : ""}` : ""
  }).filter(Boolean)
  const inventors = valuesByKey(root, "inventor").map((a) => clean(scalar(a, "name") ?? "")).filter(Boolean)
  const representatives = valuesByKey(root, "representative").map((a) => {
    const name = clean(scalar(a, "name") ?? "")
    const org = clean(scalar(a, "organisation-name") ?? "")
    return [name, org].filter(Boolean).join(", ")
  }).filter(Boolean)

  const steps = asList(valuesByKey(root, "procedure-steps")[0] ?? valuesByKey(root, "procedure-step")[0]).map((st) => {
    const b = asBag(st) ?? {}
    const code = String(b.code ?? "")
    return { date: String(b.dtd ?? ""), code, label: EPO_STEPS[code] ?? "", title: clean(String(b.step ?? b["step-detail"] ?? "")) }
  }).filter((s) => s.date || s.code).sort((a, b) => a.date.localeCompare(b.date))

  const priority = valuesByKey(root, "priority-claim").map((p) => {
    const pr = readDocRef(p)
    return pr.country && pr.number ? `${pr.country}.${pr.number}${pr.date ? ` (${pr.date})` : ""}` : ""
  }).filter(Boolean)

  const lines = [
    `EPO Register record for EP${raw}`,
    "",
    `Application: ${fmtAppRef(appRef) || "not present"}${appRef.date ? `, filed ${appRef.date}` : ""}`,
    `Applicants: ${applicants.length ? applicants.join("; ") : "not present"}`,
    `Inventors: ${inventors.length ? `${inventors.length} listed` : "not present"}`,
    `Representative: ${representatives.length ? representatives.join("; ") : "not present"}`,
    `Priority: ${priority.length ? priority.join("; ") : "none recorded"}`,
    "",
    `Procedure history (${steps.length} step(s)):`,
  ]
  for (const s of steps.slice(0, limit)) {
    lines.push(`  ${(s.date || "?").padEnd(12)}${(s.code || "?").padEnd(6)}${s.label || s.title || "step with no recognised label"}${s.label && s.title ? ` \u2014 ${s.title.slice(0, 70)}` : ""}`)
  }
  if (!steps.length) lines.push("  no procedure steps were returned")
  if (steps.length > limit) lines.push(`  ...and ${steps.length - limit} more steps; raise limit to see them.`)

  const unknownSteps = [...new Set(steps.map((s) => s.code).filter((c) => c && !EPO_STEPS[c]))]
  if (unknownSteps.length) {
    lines.push("", `${unknownSteps.length} step code(s) are not in this tool's table and are shown verbatim: ${unknownSteps.slice(0, 12).join(", ")}.`)
  }
  lines.push(
    "",
    "The register is the authoritative European record, so it is where to confirm status, deadlines and who represents the applicant. It covers European applications only: a US, Japanese or Chinese publication has no register entry, so the country code decides whether anything is here at all.",
  )
  return lines.join("\n");
}
