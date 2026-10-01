export class PlainError extends Error {
  constructor(message: string) {
    super(message)
    this.name = "PlainError"
  }
}

export function errorMessage(e: unknown): string {
  return e instanceof Error ? e.message : String(e)
}

const UA = { "User-Agent": "awesome-mcps/1.0" };
const BASE = "https://core-api.uk.plain.com/graphql/v1";

function key(): string {
  const k = process.env.PLAIN_API_KEY;
  if (!k) throw new PlainError("Set PLAIN_API_KEY (free Plain tier).");
  return k;
}

async function gql(query: string, variables: Record<string, unknown> = {}): Promise<string> {
  let res: Response;
  try {
    res = await fetch(BASE, {
      signal: AbortSignal.timeout(30000),
      method: "POST",
      headers: { ...UA, Accept: "application/json", "Content-Type": "application/json", Authorization: `Bearer ${key()}` },
      body: JSON.stringify({ query, variables }),
    });
  } catch (e) {
    throw new PlainError(`Network error: ${(e as Error).message}`);
  }
  const text = await res.text();
  if (!res.ok) throw new PlainError(`HTTP ${res.status}: ${text.slice(0, 300)}`);
  return text.slice(0, 12000);
}

export function listCustomers(limit?: string): Promise<string> {
  const n = Math.min(Number(limit ?? 10) || 10, 50);
  return gql(`query($n: Int!) { customers(first: $n) { edges { node { id fullName email { email } } } } }`, { n });
}

export function listThreads(limit?: string): Promise<string> {
  const n = Math.min(Number(limit ?? 10) || 10, 50);
  return gql(`query($n: Int!) { threads(first: $n) { edges { node { id title status priority } } } }`, { n });
}

export function getThread(threadId: string): Promise<string> {
  return gql(`query($id: ID!) { thread(id: $id) { id title status priority } }`, { id: threadId });
}

// ---- muxH tools:
// Plain is a support desk, so the questions that matter are "can we reach this
// customer's inbox" and "did we answer fast enough". Neither needs a Plain
// account, so these two answer them from the DNS and from the caller's clock.

interface DnsMx {
  exchange: string
  priority: number
}

interface DnsSoa {
  nsname: string
  hostmaster: string
  serial: number
  refresh: number
  retry: number
  expire: number
  minttl: number
}

interface ResponseSample {
  label: string
  createdAt: string
  firstReplyAt: string
}

