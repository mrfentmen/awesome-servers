
export interface m1_PriceArgs {
  metal: string;
}

const NAMES: Record<string, string> = {
  XAU: 'Gold',
  XAG: 'Silver',
  XPT: 'Platinum',
  XPD: 'Palladium',
};

// Yahoo Finance futures tickers, used when the primary spot source is
// unreachable (api.gold-api.com blocks some datacenter IP ranges).
const YAHOO_SYMBOLS: Record<string, string> = {
  XAU: 'GC=F',
  XAG: 'SI=F',
  XPT: 'PL=F',
  XPD: 'PA=F',
};

const UA = 'mrfentmen-gold-prices-mcp/1.0 (https://github.com/mrfentmen)';

export class GoldError extends Error {}

interface Quote {
  price: number;
  source: string;
  updated: string;
}

async function fromGoldApi(code: string): Promise<Quote> {
  const res = await fetch(`https://api.gold-api.com/price/${code}`, {
    headers: { 'User-Agent': UA, Accept: 'application/json' },
    signal: AbortSignal.timeout(20000),
  });
  if (res.status === 429) throw new GoldError('Gold API rate limit hit, wait and retry');
  if (!res.ok) throw new GoldError(`Gold API error ${res.status}`);
  const data = (await res.json()) as { price?: number; updatedAtReadable?: string; updatedAt?: string };
  if (typeof data.price !== 'number') throw new GoldError(`Gold API returned no price for ${code}`);
  return { price: data.price, source: 'Gold API spot', updated: data.updatedAtReadable ?? data.updatedAt ?? 'n/a' };
}

async function fromYahoo(code: string): Promise<Quote> {
  const symbol = YAHOO_SYMBOLS[code];
  if (!symbol) throw new GoldError(`No fallback symbol for ${code}`);
  const res = await fetch(`https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?range=1d&interval=1d`, {
    headers: { 'User-Agent': UA, Accept: 'application/json' },
    signal: AbortSignal.timeout(20000),
  });
  if (res.status === 429) throw new GoldError('Yahoo Finance rate limit hit, wait and retry');
  if (!res.ok) throw new GoldError(`Yahoo Finance error ${res.status}`);
  const data = (await res.json()) as {
    chart?: { result?: Array<{ meta?: { regularMarketPrice?: number; regularMarketTime?: number } }> };
  };
  const meta = data.chart?.result?.[0]?.meta;
  if (typeof meta?.regularMarketPrice !== 'number') throw new GoldError(`Yahoo Finance returned no price for ${symbol}`);
  const updated = meta.regularMarketTime ? new Date(meta.regularMarketTime * 1000).toISOString() : 'n/a';
  return { price: meta.regularMarketPrice, source: `Yahoo Finance ${symbol} futures`, updated };
}

const SOURCES = [fromGoldApi, fromYahoo];

async function fetchQuote(code: string): Promise<Quote & { name: string; code: string }> {
  if (!NAMES[code]) throw new GoldError('Metal must be XAU, XAG, XPT, or XPD');
  const failures: string[] = [];
  for (const source of SOURCES) {
    try {
      const quote = await source(code);
      return { ...quote, name: NAMES[code], code };
    } catch (e) {
      failures.push(e instanceof Error ? e.message : String(e));
    }
  }
  throw new GoldError(`All price sources failed for ${code}: ${failures.join('; ')}`);
}

const m0 = (() => {
async function price(args: { metal?: string }): Promise<string> {
  const metal = (args.metal ?? 'XAU').trim().toUpperCase();
  const q = await fetchQuote(metal);
  return `${q.name} (${q.code}): $${q.price.toLocaleString(undefined, { maximumFractionDigits: 2 })} USD`
    + `\nSource: ${q.source}\nUpdated: ${q.updated}`;
}

return { GoldError, price };
})();

const m1 = (() => {
const METAL_MAP: Record<string, string> = {
  gold: 'XAU',
  silver: 'XAG',
  platinum: 'XPT',
  palladium: 'XPD',
};

function resolveCode(input: string): string {
  const v = input.trim().toLowerCase();
  if (v in METAL_MAP) return METAL_MAP[v];
  return v.toUpperCase();
}

async function price(args: m1_PriceArgs): Promise<string> {
  if (!args.metal) return 'Provide a metal like gold, silver, platinum, or palladium.';
  const q = await fetchQuote(resolveCode(args.metal));
  return `${q.name} (${q.code}) spot price: $${q.price.toFixed(2)} (source: ${q.source})`;
}

async function all(_args: Record<string, never> = {}): Promise<string> {
  const out: string[] = [];
  for (const code of Object.keys(NAMES)) {
    try {
      const q = await fetchQuote(code);
      out.push(`${q.name} (${code}): $${q.price.toFixed(2)} (source: ${q.source})`);
    } catch (e) {
      out.push(`${NAMES[code]} (${code}): unavailable (${e instanceof Error ? e.message : String(e)})`);
    }
  }
  return `Precious metals spot prices (USD):\n` + out.map((l, i) => `${i + 1}. ${l}`).join('\n');
}

return { all, price };
})();

export const all = m1.all;
export const price = m0.price;
export const m0_GoldError = m0.GoldError;
export const m0_price = m0.price;
export const m1_all = m1.all;
export const m1_price = m1.price;
