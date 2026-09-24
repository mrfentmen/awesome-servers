/**
 * Loops API v1 client. Needs LOOPS_API_KEY (free at https://app.loops.so/).
 * Docs: https://loops.so/docs/api-reference
 */
const BASE = "https://app.loops.so/api/v1"

export class LoopsError extends Error {}

function headers(extra: Record<string, string> = {}): Record<string, string> {
  const key = process.env.LOOPS_API_KEY
  if (!key) throw new LoopsError("Set LOOPS_API_KEY first (free at app.loops.so).")
  return { "User-Agent": "loops-mcp/1.0", Accept: "application/json", Authorization: `Bearer ${key}`, ...extra }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Raw = Record<string, any>

async function getJson<T>(path: string): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    headers: headers(),
    signal: AbortSignal.timeout(20000),
  })
  if (res.status === 401 || res.status === 403) throw new LoopsError("Loops rejected the key (401/403).")
  if (res.status === 404) throw new LoopsError("Not found.")
  if (!res.ok) throw new LoopsError(`Loops error ${res.status}`)
  return (await res.json()) as T
}

async function postJson<T>(path: string, body: Raw): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    method: "POST",
    headers: headers({ "Content-Type": "application/json" }),
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(20000),
  })
  if (res.status === 401 || res.status === 403) throw new LoopsError("Loops rejected the key (401/403).")
  if (!res.ok) {
    const msg = await res.text().catch(() => "")
    throw new LoopsError(`Loops error ${res.status}: ${msg.slice(0, 160)}`)
  }
  return (await res.json()) as T
}

export interface Contact {
  id?: string
  email?: string
  firstName?: string
  lastName?: string
}

export async function findContact(email: string): Promise<Contact | null> {
  if (!email.includes("@")) throw new LoopsError(`Not an email: "${email}".`)
  const data = await getJson<Raw>(`/contacts/find?email=${encodeURIComponent(email.trim())}`)
  const list: Raw[] = Array.isArray(data) ? data : data.contacts ?? []
  const c: Raw | undefined = list[0]
  if (!c) return null
  return { id: c.id, email: c.email, firstName: c.firstName, lastName: c.lastName }
}

export async function createContact(email: string, firstName = "", lastName = ""): Promise<string> {
  if (!email.includes("@")) throw new LoopsError(`Not an email: "${email}".`)
  const body: Raw = { email: email.trim() }
  if (firstName.trim()) body.firstName = firstName.trim()
  if (lastName.trim()) body.lastName = lastName.trim()
  const data = await postJson<Raw>("/contacts/create", body)
  return `Contact ${email.trim()} created${data.id ? ` [${data.id}]` : ""}.`
}

export async function sendEvent(email: string, eventName: string, properties: Raw = {}): Promise<string> {
  if (!email.includes("@")) throw new LoopsError(`Not an email: "${email}".`)
  if (!eventName.trim()) throw new LoopsError("Event name is empty.")
  await postJson<Raw>("/events/send", { email: email.trim(), eventName: eventName.trim(), eventProperties: properties })
  return `Event ${eventName.trim()} sent for ${email.trim()}.`
}

export function formatContact(c: Contact): string {
  return `${c.email ?? "?"}${c.firstName ? ` — ${c.firstName}${c.lastName ? ` ${c.lastName}` : ""}` : ""}${c.id ? ` [${c.id}]` : ""}`
}
