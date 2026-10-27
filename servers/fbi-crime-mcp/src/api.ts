export class FbiError extends Error {
  constructor(message: string) {
    super(message)
    this.name = "FbiError"
  }
}

export function errorMessage(e: unknown): string {
  return e instanceof Error ? e.message : String(e)
}

const UA = { "User-Agent": "awesome-mcps/1.0" };

function key(): string {
  const k = process.env.FBI_API_KEY;
  if (!k) throw new FbiError("Set FBI_API_KEY (free api.data.gov signup).");
  return k;
}

async function get(dataset: string, state: string): Promise<string> {
  let res: Response;
  try {
    res = await fetch(`https://api.usa.gov/crime/fbi/cde/${dataset}/states/${encodeURIComponent(state)}/all?API_KEY=${encodeURIComponent(key())}`, {
      headers: { ...UA, Accept: "application/json" },
      signal: AbortSignal.timeout(25000),
    });
  } catch (e) {
    throw new FbiError(`Network error: ${(e as Error).message}`);
  }
  if (!res.ok) {
    const body = (await res.text()).slice(0, 300);
    throw new FbiError(`HTTP ${res.status}: ${body}`);
  }
  return (await res.text()).slice(0, 12000);
}

export function arrests(state: string): Promise<string> {
  return get("arrest", state);
}

export function offenses(state: string): Promise<string> {
  return get("offense", state);
}

export function victims(state: string): Promise<string> {
  return get("victim", state);
}
