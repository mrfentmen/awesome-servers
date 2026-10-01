/**
 * Documenso API v2 client. Points at any instance via DOCUMENSO_URL
 * (default https://app.documenso.com). Needs DOCUMENSO_API_KEY.
 * Docs: https://docs.documenso.com/developers/api
 */
const BASE = (process.env.DOCUMENSO_URL ?? "https://app.documenso.com").replace(/\/+$/, "")

export class DocumensoError extends Error {}

function headers(): Record<string, string> {
  const key = process.env.DOCUMENSO_API_KEY
  if (!key) throw new DocumensoError("Set DOCUMENSO_API_KEY first.")
  return { "User-Agent": "documenso-mcp/1.0", Accept: "application/json", Authorization: `Bearer ${key}` }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Raw = Record<string, any>

async function getJson<T>(path: string): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    headers: headers(),
    signal: AbortSignal.timeout(20000),
  })
  if (res.status === 401 || res.status === 403) throw new DocumensoError("Documenso refused (401/403). Check URL and key.")
  if (res.status === 404) throw new DocumensoError("Not found.")
  if (!res.ok) throw new DocumensoError(`Documenso error ${res.status}`)
  return (await res.json()) as T
}

export interface Document {
  id: string
  title?: string
  status?: string
  created?: string
}

export async function listDocuments(limit = 10): Promise<Document[]> {
  const data = await getJson<Raw>(`/api/v2/documents?perPage=${Math.min(Math.max(limit, 1), 100)}`)
  const rows: Raw[] = Array.isArray(data.documents) ? data.documents : []
  return rows.slice(0, limit).map((d) => ({
    id: String(d.id),
    title: d.title,
    status: d.status,
    created: d.createdAt ? String(d.createdAt).slice(0, 10) : undefined,
  }))
}

export interface DocumentDetails extends Document {
  recipients: string[]
}

export async function getDocument(id: string): Promise<DocumentDetails> {
  if (!id.trim()) throw new DocumensoError("Document id is empty.")
  const d = await getJson<Raw>(`/api/v2/documents/${encodeURIComponent(id.trim())}`)
  const doc: Raw = d.document ?? d
  const recips: Raw[] = Array.isArray(doc.recipients) ? doc.recipients : []
  return {
    id: String(doc.id ?? id),
    title: doc.title,
    status: doc.status,
    created: doc.createdAt ? String(doc.createdAt).slice(0, 10) : undefined,
    recipients: recips.map((r) => `${String(r.email ?? "?")}${r.signingStatus ? ` [${r.signingStatus}]` : ""}`),
  }
}

export function formatDocument(d: DocumentDetails | Document, index?: number): string {
  const prefix = index !== undefined ? `${index + 1}. ` : ""
  const lines = [
    `${prefix}[${d.id}] ${d.title ?? "(untitled)"}${d.status ? ` [${d.status}]` : ""}${d.created ? ` (${d.created})` : ""}`,
  ]
  if ("recipients" in d && (d as DocumentDetails).recipients.length) {
    lines.push(`Recipients:\n- ${(d as DocumentDetails).recipients.join("\n- ")}`)
  }
  return lines.join("\n")
}

// ---- muxB tools:

export async function instanceHealth(): Promise<string> {
  const res = await fetch(`${BASE}/api/health`, {
    headers: { "User-Agent": "documenso-mcp/1.0", Accept: "application/json" },
    signal: AbortSignal.timeout(20000),
  })
  if (res.status === 404) {
    return `${BASE} has no /api/health endpoint. That is expected on an older build; check the version with a document call instead.`
  }
  if (!res.ok) throw new DocumensoError(`Health check failed with HTTP ${res.status} against ${BASE}.`)
  const data = (await res.json()) as {
    status?: string
    timestamp?: string
    checks?: Record<string, { status?: string; message?: string }>
  }
  const checks = data.checks && typeof data.checks === "object" ? data.checks : {}
  const names = Object.keys(checks)
  const out = [
    `${BASE}: ${data.status ?? "no status reported"}${data.timestamp ? `, checked ${String(data.timestamp).replace("T", " ").slice(0, 19)}` : ""}.`,
    names.length === 0 ? "The instance reported no individual checks." : `Checks reported: ${names.length}.`,
  ]
  for (const name of names.slice(0, 12)) {
    const c = checks[name]
    out.push(`  - ${name}: ${c?.status ?? "not reported"}${c?.message ? ` (${c.message})` : ""}`)
  }
  if (data.status === "ok") {
    out.push(
      "",
      "This is the instance DOCUMENSO_URL points at, so a self-hosted deployment reports its own",
      "database and certificate state here. A failing certificate check means signatures will not be trusted by signers."
    )
  } else {
    out.push("", `The instance is reporting "${data.status ?? "an unknown state"}", so document calls are likely to fail.`)
  }
  return out.join("\n")
}

const DOC_ROLES: Record<string, string> = {
  signer: "SIGNER",
  approver: "APPROVER",
  viewer: "VIEWER",
  cc: "CC",
  assistant: "ASSISTANT",
}

const DOC_ACTION_FREE = new Set(["VIEWER", "CC"])
const DOC_FIELD_TYPES = new Set([
  "SIGNATURE", "FREE_SIGNATURE", "INITIALS", "NAME", "EMAIL", "DATE", "TEXT", "NUMBER", "RADIO", "CHECKBOX", "DROPDOWN",
])
const DOC_EMAIL = /^[^\s@]+@[^\s@.]+(\.[^\s@.]+)+$/

export interface DocRecipient {
  email: string
  name?: string
  role?: string
  order?: number
}

export interface DocField {
  label: string
  type: string
  for?: string
}

export interface DocPlanArgs {
  recipients: DocRecipient[]
  fields?: DocField[]
  envelope_id?: string
}

export async function signingFlowPlan(args: DocPlanArgs): Promise<string> {
  const given = Array.isArray(args.recipients) ? args.recipients : []
  if (given.length === 0) {
    return "List the recipients, e.g. recipients: [{email: 'a@x.com', name: 'A', role: 'approver', order: 1}, {email: 'b@x.com', name: 'B', role: 'signer', order: 2}]."
  }
  const problems: string[] = []
  const emails = new Map<string, number>()
  const rows: Array<{ email: string; name: string; role: string; order: number; givenOrder?: number }> = []
  given.slice(0, 30).forEach((r, i) => {
    const email = String(r.email ?? "").trim().toLowerCase()
    const rawRole = String(r.role ?? "signer").trim().toLowerCase()
    const role = DOC_ROLES[rawRole]
    if (!role) problems.push(`recipient ${i + 1}: "${r.role}" is not a Documenso role, use ${Object.keys(DOC_ROLES).join(", ")}`)
    if (!DOC_EMAIL.test(email)) problems.push(`recipient ${i + 1}: "${r.email}" is not an email address`)
    if (emails.has(email)) problems.push(`recipient ${i + 1}: ${email} is already recipient ${emails.get(email)}, each person is added once`)
    else emails.set(email, i + 1)
    const name = String(r.name ?? "").trim()
    if (!name) problems.push(`recipient ${i + 1}: no name; the create-many call requires one and it is what the signer sees on the document`)
    const order = Number.isFinite(r.order as number) ? Math.round(Number(r.order)) : i + 1
    if (order < 1) problems.push(`recipient ${i + 1}: signing order ${order} is below 1, orders start at 1`)
    rows.push({ email, name, role: role ?? "SIGNER", order, givenOrder: Number.isFinite(r.order as number) ? Math.round(Number(r.order)) : undefined })
  })
  const acting = rows.filter((r) => !DOC_ACTION_FREE.has(r.role))
  const usedOrders = new Map<number, string>()
  for (const r of acting) {
    const clash = usedOrders.get(r.order)
    if (clash) problems.push(`${r.email} and ${clash} are both at signing order ${r.order}; give each round one person, or leave order off so they sign in parallel`)
    else usedOrders.set(r.order, r.email)
  }
  const orders = [...new Set(acting.map((r) => r.order))].sort((a, b) => a - b)
  const gaps: number[] = []
  for (let o = 1; o <= orders[orders.length - 1]; o++) if (!orders.includes(o)) gaps.push(o)
  if (gaps.length > 0) problems.push(`signing orders skip ${gaps.join(", ")}, which leaves an empty round in the sequence`)
  const approvers = rows.filter((r) => r.role === "APPROVER")
  const signers = rows.filter((r) => r.role === "SIGNER")
  for (const a of approvers) {
    for (const s of signers) {
      if (a.order > s.order) {
        problems.push(`${a.email} approves at order ${a.order} but ${s.email} signs at order ${s.order}; an approver has to come before the signers it releases`)
        break
      }
    }
  }
  if (signers.length === 0) problems.push("no SIGNER in the list, so nothing will be signed")
  const fields = Array.isArray(args.fields) ? args.fields : []
  const fieldRows: Array<{ label: string; type: string; for: string; known: boolean }> = []
  fields.slice(0, 60).forEach((f, i) => {
    const type = String(f.type ?? "").trim().toUpperCase()
    const target = String(f.for ?? "").trim().toLowerCase()
    if (!DOC_FIELD_TYPES.has(type)) problems.push(`field ${i + 1}: type "${f.type}" is not one of ${[...DOC_FIELD_TYPES].join(", ")}`)
    if (type === "FREE_SIGNATURE") problems.push(`field ${i + 1}: FREE_SIGNATURE is the legacy free-form signature; the docs say to avoid it in new integrations, use SIGNATURE`)
    const known = emails.has(target)
    if (target && !known) problems.push(`field ${i + 1} (${f.label}): "${f.for}" is not one of the recipients`)
    if (!target) problems.push(`field ${i + 1} (${f.label}): no recipient assigned, so nobody will be asked to complete it`)
    const row = rows.find((r) => r.email === target)
    if (row && DOC_ACTION_FREE.has(row.role)) problems.push(`field ${i + 1} (${f.label}): ${row.email} is ${row.role}, which takes no action, so this field can never be filled in`)
    fieldRows.push({ label: String(f.label ?? "(unnamed)"), type: type || "SIGNATURE", for: target, known })
  })
  const signatureFields = fieldRows.filter((f) => f.type === "SIGNATURE" || f.type === "FREE_SIGNATURE")
  for (const s of signers) {
    const has = signatureFields.some((f) => f.for === s.email)
    if (!has) problems.push(`${s.email} is a SIGNER with no SIGNATURE field assigned to them`)
  }
  rows.sort((a, b) => a.order - b.order || a.email.localeCompare(b.email))
  const timeline: string[] = []
  for (const o of orders) {
    const inRound = acting.filter((r) => r.order === o)
    timeline.push(`  round ${o}: ${inRound.map((r) => `${r.name || r.email} (${r.role})`).join(", ")}`)
  }
  const bystanders = rows.filter((r) => DOC_ACTION_FREE.has(r.role))
  if (bystanders.length > 0) {
    timeline.push(`  out of the sequence: ${bystanders.map((r) => `${r.name || r.email} (${r.role})`).join(", ")}, they get the document without acting on it`)
  }
  const body = {
    ...(args.envelope_id ? { envelopeId: String(args.envelope_id) } : {}),
    data: rows.map((r) => ({
      email: r.email,
      name: r.name,
      role: r.role,
      signingOrder: DOC_ACTION_FREE.has(r.role) ? null : r.order,
    })),
  }
  return [
    `${rows.length} recipient(s), ${fieldRows.length} field(s) planned.`,
    "",
    "Signing order:",
    ...timeline,
    "",
    "Recipients:",
    ...rows.map((r) => `  ${r.order}. ${r.name || "(no name)"} <${r.email}> ${r.role}`),
    "",
    "Fields:",
    ...(fieldRows.length === 0
      ? ["  none listed"]
      : fieldRows.map((f) => `  ${f.label}: ${f.type} for ${f.known ? f.for : "(unassigned recipient)"}`)),
    "",
    "Request body for POST /api/v2/envelope/recipient/create-many:",
    JSON.stringify(body, null, 2).split("\n").map((l) => `  ${l}`).join("\n"),
    "",
    "Sequence: create the envelope (POST /api/v2/envelope/create), add these recipients, add the",
    "fields with the recipient ids the create call returns, then POST /api/v2/envelope/distribute",
    "to move it from DRAFT to PENDING and send the invitations.",
    ...(problems.length ? ["", `Problems (${problems.length}):`, ...problems.map((p) => `  - ${p}`)] : ["", "Problems: none, the plan is ready to send."]),
  ].join("\n")
}
