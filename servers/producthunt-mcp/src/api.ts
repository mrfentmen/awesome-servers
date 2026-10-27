export class PhError extends Error {
  constructor(message: string) {
    super(message)
    this.name = "PhError"
  }
}

export function errorMessage(e: unknown): string {
  return e instanceof Error ? e.message : String(e)
}

const UA = { "User-Agent": "awesome-mcps/1.0" };

function key(): string {
  const k = process.env.PRODUCTHUNT_TOKEN;
  if (!k) throw new PhError("Set PRODUCTHUNT_TOKEN (Product Hunt OAuth token).");
  return k;
}

async function gql(query: string, variables: Record<string, unknown> = {}): Promise<string> {
  let res: Response;
  try {
    res = await fetch("https://api.producthunt.com/v2/api/graphql", {
      method: "POST",
      headers: { ...UA, Accept: "application/json", "Content-Type": "application/json", Authorization: `Bearer ${key()}` },
      body: JSON.stringify({ query, variables }),
      signal: AbortSignal.timeout(25000),
    });
  } catch (e) {
    throw new PhError(`Network error: ${(e as Error).message}`);
  }
  const text = await res.text();
  if (!res.ok) throw new PhError(`HTTP ${res.status}: ${text.slice(0, 300)}`);
  return text.slice(0, 12000);
}

export function viewer(): Promise<string> {
  return gql("query { viewer { user { name username } } }");
}

export function listPosts(limit?: string): Promise<string> {
  const n = Math.min(Number(limit ?? 10) || 10, 50);
  return gql(
    "query($n: Int!) { posts(first: $n, order: RANKING) { edges { node { name tagline votesCount url } } } }",
    { n }
  );
}

