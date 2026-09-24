
export interface m1_PriceArgs {
  metal: string;
}

const m0 = (() => {
const BASE = "https://api.gold-api.com/price"
const UA = "mrfentmen-gold-prices-mcp/1.0 (https://github.com/mrfentmen)"
class GoldError extends Error {}

const METALS: Record<string, string> = {
  XAU: "Gold",
  XAG: "Silver",
  XPT: "Platinum",
  XPD: "Palladium",
}

async function price(args: { metal?: string }): Promise<string> {
  const metal = (args.metal ?? "XAU").trim().toUpperCase()
  if (!METALS[metal]) throw new GoldError("Metal must be XAU, XAG, XPT, or XPD")
  const res = await fetch(`${BASE}/${metal}`, { headers: { "User-Agent": UA, Accept: "application/json" }, signal: AbortSignal.timeout(20000) })
  if (res.status === 429) throw new GoldError("Gold API rate limit hit, wait and retry")
  if (!res.ok) throw new GoldError(`Gold API error ${res.status}`)
  const d = (await res.json()) as any
  return `${METALS[metal]} (${metal}): $${Number(d?.price ?? 0).toLocaleString(undefined, { maximumFractionDigits: 2 })} ${d?.currency ?? "USD"}\nUpdated: ${d?.updatedAtReadable ?? d?.updatedAt ?? "n/a"}`
}

return { GoldError, price };
})();

const m1 = (() => {
const BASE = 'https://api.gold-api.com';

const METAL_MAP: Record<string, string> = {
  gold: 'XAU',
  silver: 'XAG',
  platinum: 'XPT',
  palladium: 'XPD',
};

const NAMES: Record<string, string> = {
  XAU: 'Gold',
  XAG: 'Silver',
  XPT: 'Platinum',
  XPD: 'Palladium',
};


function resolveCode(input: string): string {
  const v = input.trim().toLowerCase();
  if (v in METAL_MAP) return METAL_MAP[v];
  return v.toUpperCase();
}

async function fetchPrice(code: string): Promise<{ name: string; price: number }> {
  const res = await fetch(`${BASE}/price/${code}`, {
    headers: { 'User-Agent': 'mrfentmen-metal-prices-mcp/1.0', Accept: 'application/json' },
    signal: AbortSignal.timeout(25000),
  });
  if (!res.ok) throw new Error(`Gold API returned ${res.status}`);
  const data = (await res.json()) as { price?: number; name?: string };
  if (typeof data.price !== 'number') throw new Error(`No price for metal ${code}`);
  return { name: data.name ?? NAMES[code] ?? code, price: data.price };
}

async function price(args: m1_PriceArgs): Promise<string> {
  if (!args.metal) return 'Provide a metal like gold, silver, platinum, or palladium.';
  const code = resolveCode(args.metal);
  const { name, price: p } = await fetchPrice(code);
  return `${name} (${code}) spot price: $${p.toFixed(2)}`;
}

async function all(_args: Record<string, never> = {}): Promise<string> {
  const codes = ['XAU', 'XAG', 'XPT', 'XPD'];
  const out: string[] = [];
  for (const code of codes) {
    try {
      const { name, price: p } = await fetchPrice(code);
      out.push(`${name} (${code}): $${p.toFixed(2)}`);
    } catch (e) {
      out.push(`${NAMES[code] ?? code}: unavailable (${e instanceof Error ? e.message : String(e)})`);
    }
  }
  return `Precious metals spot prices (USD):\n` + out.map((l, i) => `${i + 1}. ${l}`).join('\n');
}

return { all, price };
})();

export const GoldError = m0.GoldError;
export const all = m1.all;
export const price = m0.price;
export const m0_GoldError = m0.GoldError;
export const m0_price = m0.price;
export const m1_all = m1.all;
export const m1_price = m1.price;
