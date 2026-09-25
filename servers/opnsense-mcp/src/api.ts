export class OpnSenseError extends Error {
  constructor(message: string) {
    super(message)
    this.name = "OpnSenseError"
  }
}

export function errorMessage(e: unknown): string {
  return e instanceof Error ? e.message : String(e)
}

const UA = { "User-Agent": "awesome-mcps/1.0" };

function base(): string {
  const b = process.env.OPNSENSE_URL;
  if (!b) throw new OpnSenseError("Set OPNSENSE_URL (your OPNsense base URL).");
  return b.replace(/\/$/, "");
}

function headers(): Record<string, string> {
  const k = process.env.OPNSENSE_KEY;
  const s = process.env.OPNSENSE_SECRET;
  if (!k || !s) throw new OpnSenseError("Set OPNSENSE_KEY and OPNSENSE_SECRET (System > Access > Users > API keys).");
  return { ...UA, Accept: "application/json", Authorization: `Basic ${Buffer.from(`${k}:${s}`).toString("base64")}` };
}

async function get(path: string): Promise<string> {
  let res: Response;
  try {
    res = await fetch(base() + path, { headers: headers() });
  } catch (e) {
    throw new OpnSenseError(`Network error: ${(e as Error).message}`);
  }
  if (!res.ok) {
    const body = (await res.text()).slice(0, 300);
    throw new OpnSenseError(`HTTP ${res.status}: ${body}`);
  }
  return (await res.text()).slice(0, 8000);
}

export function getFirmwareStatus(): Promise<string> {
  return get("/api/core/firmware/status");
}

export function getInterfaces(): Promise<string> {
  return get("/api/diagnostics/interface/getInterfaceStatistics");
}

