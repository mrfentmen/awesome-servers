export class SpaceError extends Error {
  constructor(message: string) {
    super(message)
    this.name = "SpaceError"
  }
}

export function errorMessage(e: unknown): string {
  return e instanceof Error ? e.message : String(e)
}

const UA = { "User-Agent": "awesome-mcps/1.0" };

async function get(path: string): Promise<string> {
  let res: Response;
  try {
    res = await fetch("https://ll.thespacedevs.com/2.3.0" + path, {
      headers: { ...UA, Accept: "application/json" },
      signal: AbortSignal.timeout(25000),
    });
  } catch (e) {
    throw new SpaceError(`Network error: ${(e as Error).message}`);
  }
  if (!res.ok) {
    const body = (await res.text()).slice(0, 300);
    throw new SpaceError(`HTTP ${res.status}: ${body}`);
  }
  return (await res.text()).slice(0, 12000);
}

export function upcoming(limit?: string): Promise<string> {
  const n = Math.min(Number(limit ?? 5) || 5, 20);
  return get(`/launches/upcoming/?limit=${n}`);
}

export function previous(limit?: string): Promise<string> {
  const n = Math.min(Number(limit ?? 5) || 5, 20);
  return get(`/launches/previous/?limit=${n}`);
}

export function getLaunch(launchId: string): Promise<string> {
  return get(`/launches/${encodeURIComponent(launchId)}/`);
}

