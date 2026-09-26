export class ApolloError extends Error {
  constructor(message: string) {
    super(message)
    this.name = "ApolloError"
  }
}

export function errorMessage(e: unknown): string {
  return e instanceof Error ? e.message : String(e)
}

const UA = { "User-Agent": "awesome-mcps/1.0" };

function headers(json: boolean): Record<string, string> {
  const k = process.env.APOLLO_API_KEY;
  if (!k) throw new ApolloError("Set APOLLO_API_KEY (free Apollo plan).");
  const h: Record<string, string> = { ...UA, Accept: "application/json", "X-Api-Key": k };
  if (json) h["Content-Type"] = "application/json";
  return h;
}

async function call(path: string, method: string, body?: Record<string, unknown>): Promise<string> {
  let res: Response;
  try {
    res = await fetch("https://api.apollo.io" + path, {
      method,
      headers: headers(method === "POST"),
      body: body !== undefined ? JSON.stringify(body) : undefined,
      signal: AbortSignal.timeout(25000),
    });
  } catch (e) {
    throw new ApolloError(`Network error: ${(e as Error).message}`);
  }
  const text = await res.text();
  if (!res.ok) throw new ApolloError(`HTTP ${res.status}: ${text.slice(0, 300)}`);
  return text.slice(0, 12000);
}

export function health(): Promise<string> {
  return call("/v1/auth/health", "GET");
}

export function matchPerson(email?: string, firstName?: string, lastName?: string, organization?: string): Promise<string> {
  const body: Record<string, unknown> = {};
  if (email) body.email = email;
  if (firstName) body.first_name = firstName;
  if (lastName) body.last_name = lastName;
  if (organization) body.organization_name = organization;
  return call("/v1/people/match", "POST", body);
}

export function searchPeople(query: string, limit?: string): Promise<string> {
  const n = Math.min(Number(limit ?? 5) || 5, 25);
  return call("/v1/mixed_people/api_search", "POST", { q_keywords: query, page: 1, per_page: n });
}

