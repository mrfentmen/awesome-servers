export class AlpacaError extends Error {
  constructor(message: string) {
    super(message)
    this.name = "AlpacaError"
  }
}

export function errorMessage(e: unknown): string {
  return e instanceof Error ? e.message : String(e)
}

const UA = { "User-Agent": "awesome-mcps/1.0" };

function base(): string {
  return (process.env.ALPACA_BASE_URL ?? "https://paper-api.alpaca.markets").replace(/\/$/, "");
}

function headers(): Record<string, string> {
  const id = process.env.ALPACA_API_KEY_ID;
  const secret = process.env.ALPACA_API_SECRET_KEY;
  if (!id || !secret) throw new AlpacaError("Set ALPACA_API_KEY_ID and ALPACA_API_SECRET_KEY (Alpaca paper).");
  return { ...UA, Accept: "application/json", "APCA-API-KEY-ID": id, "APCA-API-SECRET-KEY": secret };
}

async function get(path: string): Promise<string> {
  let res: Response;
  try {
    res = await fetch(base() + path, {
      headers: headers(),
      signal: AbortSignal.timeout(25000),
    });
  } catch (e) {
    throw new AlpacaError(`Network error: ${(e as Error).message}`);
  }
  if (!res.ok) {
    const body = (await res.text()).slice(0, 300);
    throw new AlpacaError(`HTTP ${res.status}: ${body}`);
  }
  return (await res.text()).slice(0, 12000);
}

export function account(): Promise<string> {
  return get("/v2/account");
}

export function positions(): Promise<string> {
  return get("/v2/positions");
}

export function orders(limit?: string): Promise<string> {
  const n = Math.min(Number(limit ?? 20) || 20, 100);
  return get(`/v2/orders?limit=${n}&direction=desc`);
}

