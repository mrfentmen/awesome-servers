export class LiteralError extends Error {
  constructor(message: string) {
    super(message)
    this.name = "LiteralError"
  }
}

export function errorMessage(e: unknown): string {
  return e instanceof Error ? e.message : String(e)
}

const UA = { "User-Agent": "awesome-mcps/1.0" }

function envStrict(name: string): string {
  const v = process.env[name]
  if (!v) throw new LiteralError(`Set the ${name} environment variable.`)
  return v
}

let cachedToken = "";
async function authHeaders(): Promise<Record<string, string>> {
  if (!cachedToken) {
    const res = await fetch("https://literal.club/graphql/", {
      method: "POST",
      headers: { ...UA, "Content-Type": "application/json" },
      body: JSON.stringify({ query: "mutation($email: String!, $password: String!) { login(email: $email, password: $password) { token } }", variables: { email: envStrict("LITERAL_EMAIL"), password: envStrict("LITERAL_PASSWORD") } }),
    });
    if (!res.ok) throw new LiteralError(`Literal login failed: HTTP ${res.status}`);
    const data = (await res.json()) as { data?: { login?: { token?: string } } };
    if (!data.data?.login?.token) throw new LiteralError("Literal login returned no token");
    cachedToken = data.data.login.token;
  }
  return { Authorization: "Bearer " + cachedToken };
}
async function gql(query: string, variables?: Record<string, unknown>): Promise<unknown> {
  const data = await req("https://literal.club/graphql/", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(variables === undefined ? { query } : { query, variables }) });
  const body = data as { data?: unknown; errors?: Array<{ message?: string }> };
  if (body.errors && body.errors.length > 0) throw new LiteralError(body.errors.map((e) => e.message ?? "GraphQL error").join("; "));
  return body.data;
}

function pretty(data: unknown): string {
  const t = typeof data === "string" ? data : JSON.stringify(data, null, 2)
  return t.length > 12000 ? t.slice(0, 12000) + "\n…(truncated)" : t
}

async function req(url: string, init: RequestInit = {}): Promise<unknown> {
  const res = await fetch(url, { headers: { ...UA, ...(await authHeaders()), ...(init.headers ?? {}) }, ...init })
  const ct = res.headers.get("content-type") ?? ""
  const data = ct.includes("json") ? await res.json() : await res.text()
  if (!res.ok) {
    const detail = typeof data === "string" ? data.slice(0, 300) : JSON.stringify(data).slice(0, 300)
    throw new LiteralError(`HTTP ${res.status}: ${detail}`)
  }
  return data
}

export async function getBooks(limit?: number, search?: string): Promise<string> {
  let url = ``;
  const q = `query($limit: Int, $search: String) { myBooks(limit: $limit, offset: 0, sortBy: recency, sortDirection: desc, search: $search) { id title slug cover authors { name } } }`;
  const data = await gql(q, { limit: limit ?? 20, search: search ?? null });
  return pretty(data);
}

export async function getBooksByState(state: string, limit?: number): Promise<string> {
  let url = ``;
  const q = `query($state: ReadingState!, $limit: Int) { myBooksByReadingState(limit: $limit, offset: 0, readingStatus: $state) { id title slug cover authors { name } } }`;
  const data = await gql(q, { state, limit: limit ?? 20 });
  return pretty(data);
}

export async function getBook(slug: string): Promise<string> {
  let url = ``;
  const q = `query($slug: String!) { bookBySlug(slug: $slug) { id title slug cover description authors { name } } }`;
  const data = await gql(q, { slug });
  return pretty(data);
}
