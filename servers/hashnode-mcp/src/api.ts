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



export function publicationInfo(host: string): Promise<string> {
  return gql("query($h: String!) { publication(host: $h) { title displayTitle about { markdown } } }", { h: host });
}

export function postDetails(host: string, slug: string): Promise<string> {
  return gql(
    "query($h: String!, $s: String!) { publication(host: $h) { post(slug: $s) { title brief url readTimeInMinutes } } }",
    { h: host, s: slug }
  );
}

export function seriesList(host: string, limit?: string): Promise<string> {
  const n = Math.min(Number(limit ?? 5) || 5, 20);
  return gql(
    "query($h: String!, $n: Int!) { publication(host: $h) { seriesList(first: $n) { edges { node { name slug } } } } }",
    { h: host, n }
  );
}

export function tagInfo(slug: string): Promise<string> {
  return gql("query($s: String!) { tag(slug: $s) { name slug } }", { s: slug });
}

export function userStats(username: string): Promise<string> {
  return gql("query($u: String!) { user(username: $u) { name followersCount } }", { u: username });
}

export function userPublications(username: string): Promise<string> {
  return gql(
    "query($u: String!) { user(username: $u) { publications(first: 5) { edges { node { title displayTitle } } } } }",
    { u: username }
  );
}

export function publicationMembers(host: string): Promise<string> {
  return gql(
    "query($h: String!) { publication(host: $h) { members(first: 10) { edges { node { role user { username name } } } } } }",
    { h: host }
  );
}
