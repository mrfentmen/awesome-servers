const BASE = 'https://www.okx.com/api/v5/market';

export interface TickerArgs {
  instId: string;
}

export async function ticker(args: TickerArgs): Promise<string> {
  const instId = (args.instId ?? '').trim().toUpperCase();
  if (!instId) return 'Provide an instrument like BTC-USDT.';
  const res = await fetch(`${BASE}/ticker?instId=${encodeURIComponent(instId)}`, {
    headers: { 'User-Agent': 'mrfentmen-okx-mcp/1.0', Accept: 'application/json' },
    signal: AbortSignal.timeout(20000),
  });
  if (!res.ok) throw new Error(`OKX returned ${res.status}`);
  const data = (await res.json()) as { code?: string; data?: Array<Record<string, string>> };
  if (data.code !== '0' || !data.data?.length) return `No price found for ${instId}.`;
  const d = data.data[0];
  return `${d.instId ?? instId} on OKX:\n` +
    [
      `Price: ${d.last ?? 'n/a'}`,
      `24h high: ${d.high24h ?? 'n/a'}`,
      `24h low: ${d.low24h ?? 'n/a'}`,
      `24h volume: ${Number(d.vol24h ?? 0).toLocaleString()}`,
    ].join('\n');
}

// ---- muxC tools:

const OKX_UA = "mrfentmen-okx-mcp/1.0 (https://github.com/mrfentmen)"

const OKX = "https://www.okx.com/api/v5"

async function okx(path: string, ms = 25000): Promise<any[]> {
  const res = await fetch(`${OKX}${path}`, { headers: { "User-Agent": OKX_UA, Accept: "application/json" }, signal: AbortSignal.timeout(ms) })
  if (!res.ok) throw new Error(`OKX returned ${res.status} for ${path}`)
  const d = (await res.json()) as { code?: string; msg?: string; data?: any[] }
  if (d.code !== "0") throw new Error(`OKX said code ${d.code}: ${d.msg ?? "no message"}`)
  return d.data ?? []
}

function instId(value: string | undefined): string {
  const v = (value ?? "").trim().toUpperCase()
  if (!v) throw new Error("Provide an instrument, e.g. BTC-USDT")
  if (!/^[A-Z0-9]+-[A-Z0-9]+$/.test(v)) throw new Error("An OKX instrument is BASE-QUOTE, e.g. BTC-USDT or ETH-BTC")
  return v
}

