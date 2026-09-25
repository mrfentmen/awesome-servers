export class NetdataError extends Error {
  constructor(message: string) {
    super(message)
    this.name = "NetdataError"
  }
}

export function errorMessage(e: unknown): string {
  return e instanceof Error ? e.message : String(e)
}

const UA = { "User-Agent": "awesome-mcps/1.0" };

function base(): string {
  const b = process.env.NETDATA_URL;
  if (!b) throw new NetdataError("Set NETDATA_URL (your Netdata agent URL).");
  return b.replace(/\/$/, "");
}

function headers(): Record<string, string> {
  const h: Record<string, string> = { ...UA, Accept: "application/json" };
  if (process.env.NETDATA_TOKEN) h.Authorization = `Bearer ${process.env.NETDATA_TOKEN}`;
  return h;
}

async function get(path: string, maxChars: number): Promise<string> {
  let res: Response;
  try {
    res = await fetch(base() + path, { headers: headers() });
  } catch (e) {
    throw new NetdataError(`Network error: ${(e as Error).message}`);
  }
  if (!res.ok) {
    const body = (await res.text()).slice(0, 300);
    throw new NetdataError(`HTTP ${res.status}: ${body}`);
  }
  return (await res.text()).slice(0, maxChars);
}

export function getInfo(): Promise<string> {
  return get("/api/v1/info", 4000);
}

export function listCharts(): Promise<string> {
  return get("/api/v1/charts", 12000);
}

export function getData(chart: string, points?: string): Promise<string> {
  const n = Math.min(Number(points ?? 20) || 20, 100);
  return get(`/api/v1/data?chart=${encodeURIComponent(chart)}&points=${n}&format=json`, 12000);
}

