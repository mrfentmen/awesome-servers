export class HashnodeError extends Error {
  constructor(message: string) {
    super(message)
    this.name = "HashnodeError"
  }
}

export function errorMessage(e: unknown): string {
  return e instanceof Error ? e.message : String(e)
}

const UA = { "User-Agent": "awesome-mcps/1.0" };

function key(): string {
  const k = process.env.HASHNODE_TOKEN;
  if (!k) throw new HashnodeError("Set HASHNODE_TOKEN (Hashnode PAT).");
  return k;
}

async function gql(query: string, variables: Record<string, unknown> = {}): Promise<string> {
  let res: Response;
  try {
    res = await fetch("https://gql-beta.hashnode.com/", {
      method: "POST",
      headers: { ...UA, Accept: "application/json", "Content-Type": "application/json", Authorization: key() },
      body: JSON.stringify({ query, variables }),
      signal: AbortSignal.timeout(25000),
    });
  } catch (e) {
    throw new HashnodeError(`Network error: ${(e as Error).message}`);
  }
  const text = await res.text();
  if (!res.ok) throw new HashnodeError(`HTTP ${res.status}: ${text.slice(0, 300)}`);
  return text.slice(0, 12000);
}

export function me(): Promise<string> {
  return gql("query { me { name username } }");
}

export function publicationPosts(host: string, limit?: string): Promise<string> {
  const n = Math.min(Number(limit ?? 5) || 5, 20);
  return gql(
    "query($h: String!, $n: Int!) { publication(host: $h) { title posts(first: $n) { edges { node { title brief url } } } } }",
    { h: host, n }
  );
}

export function getUser(username: string): Promise<string> {
  return gql("query($u: String!) { user(username: $u) { name bio } }", { u: username });
}

