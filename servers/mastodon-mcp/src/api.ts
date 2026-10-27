export class MastodonError extends Error {
  constructor(message: string) {
    super(message)
    this.name = "MastodonError"
  }
}

export function errorMessage(e: unknown): string {
  return e instanceof Error ? e.message : String(e)
}

const UA = { "User-Agent": "awesome-mcps/1.0" };

function base(): string {
  return (process.env.MASTODON_INSTANCE ?? "https://mastodon.social").replace(/\/$/, "");
}

async function get(path: string): Promise<string> {
  let res: Response;
  try {
    res = await fetch(base() + path, {
      headers: { ...UA, Accept: "application/json" },
      signal: AbortSignal.timeout(25000),
    });
  } catch (e) {
    throw new MastodonError(`Network error: ${(e as Error).message}`);
  }
  if (!res.ok) {
    const body = (await res.text()).slice(0, 300);
    throw new MastodonError(`HTTP ${res.status}: ${body}`);
  }
  return (await res.text()).slice(0, 12000);
}

export function trendingTags(limit?: string): Promise<string> {
  const n = Math.min(Number(limit ?? 10) || 10, 20);
  return get(`/api/v1/trends/tags?limit=${n}`);
}

export function trendingPosts(limit?: string): Promise<string> {
  const n = Math.min(Number(limit ?? 10) || 10, 20);
  return get(`/api/v1/trends/statuses?limit=${n}`);
}

export function instanceInfo(): Promise<string> {
  return get("/api/v2/instance");
}

