const BASE = 'https://api.cryptorank.io/v0';
const UA = 'mrfentmen-cryptorank-mcp/1.0';

export interface CoinsArgs {
  limit?: number;
}

export interface CoinArgs {
  key: string;
}

export async function coins(args: CoinsArgs): Promise<string> {
  const limit = Math.min(Math.max(Number(args?.limit ?? 20) || 20, 1), 50);
  const res = await fetch(`${BASE}/coins?limit=${limit}`, {
    headers: { 'User-Agent': UA, Accept: 'application/json' },
    signal: AbortSignal.timeout(20000),
  });
  if (!res.ok) throw new Error(`CryptoRank returned ${res.status}`);
  const d = (await res.json()) as { data?: Array<{ rank?: number; name?: string; symbol?: string; key?: string; values?: { USD?: { price?: number; percentChange24h?: number } } }> };
  const list = d.data ?? [];
  if (!list.length) return 'No coins returned.';
  return `CryptoRank top coins (${list.length}):\n` +
    list.map((c, i) => {
      const usd = c.values?.USD ?? {};
      const chg = usd.percentChange24h != null ? `${usd.percentChange24h >= 0 ? '+' : ''}${usd.percentChange24h.toFixed(2)}%` : '?';
      return `${i + 1}. #${c.rank ?? '?'} ${c.name ?? '?'} (${c.symbol ?? '?'}) $${usd.price ?? '?'} ${chg}`;
    }).join('\n');
}

export async function coin(args: CoinArgs): Promise<string> {
  const key = (args.key ?? '').trim().toLowerCase();
  if (!key) return 'Provide a coin key like bitcoin.';
  const res = await fetch(`${BASE}/coins/${encodeURIComponent(key)}`, {
    headers: { 'User-Agent': UA, Accept: 'application/json' },
    signal: AbortSignal.timeout(20000),
  });
  if (!res.ok) throw new Error(`CryptoRank returned ${res.status}`);
  const d = (await res.json()) as { data?: { rank?: number; name?: string; symbol?: string; description?: string; values?: { USD?: { price?: number; percentChange24h?: number; marketCap?: number; volume24h?: number } } } };
  const c = d.data ?? {};
  const usd = c.values?.USD ?? {};
  const fmt = (n?: number) => (n != null ? `$${n >= 1000 ? n.toLocaleString() : n}` : '?');
  return [
    `CryptoRank ${c.name ?? key} (${c.symbol ?? '?'})`,
    c.rank != null ? `Rank: #${c.rank}` : null,
    `Price: ${fmt(usd.price)}`,
    usd.percentChange24h != null ? `24h: ${usd.percentChange24h >= 0 ? '+' : ''}${usd.percentChange24h.toFixed(2)}%` : null,
    usd.marketCap != null ? `Market cap: ${fmt(usd.marketCap)}` : null,
    usd.volume24h != null ? `Volume 24h: ${fmt(usd.volume24h)}` : null,
    c.description ? `Description: ${c.description.slice(0, 300)}` : null,
  ].filter(Boolean).join('\n');
}

// ---- muxD tools:

/**
 * The two tools above this block still call the old v0 API with no key. CryptoRank
 * has since moved to v3, where every endpoint needs an X-Api-Key and consumes plan
 * credits, so the new tools below target v3 and read CRYPTORANK_API_KEY.
 */
const V3_BASE = 'https://api.cryptorank.io/v3';

function rkHeaders(): Record<string, string> {
  const key = process.env.CRYPTORANK_API_KEY;
  if (!key) {
    throw new Error(
      'Set CRYPTORANK_API_KEY (CryptoRank dashboard > API keys). CryptoRank v3 requires a key on every endpoint and bills each call against plan credits.',
    );
  }
  return { 'User-Agent': UA, Accept: 'application/json', 'X-Api-Key': key };
}

async function rkGet<T>(path: string): Promise<T> {
  // Build the headers before the try, otherwise a missing key is reported as a
  // network error and sends people to check their connection instead of their env.
  const requestHeaders = rkHeaders();
  let res: Response;
  try {
    res = await fetch(`${V3_BASE}${path}`, { headers: requestHeaders, signal: AbortSignal.timeout(25000) });
  } catch (e) {
    throw new Error(`Network error calling CryptoRank: ${(e as Error).message}`);
  }
  const contentType = res.headers.get('content-type') ?? '';
  if (res.status === 403 && /text\/html/i.test(contentType)) {
    // CryptoRank sits behind a Cloudflare bot challenge that answers 403 with an
    // HTML page. Saying "returned 403" sends people looking for an API problem.
    throw new Error(
      'CryptoRank returned a 403 with an HTML body, which is a Cloudflare bot challenge rather than an API error. This request never reached the API. Retry from a normal network, or set CRYPTORANK_API_KEY and expect the same challenge to apply to keyed calls too.',
    );
  }
  if (res.status === 401) throw new Error('CryptoRank rejected CRYPTORANK_API_KEY (401). Check the key in the CryptoRank dashboard.');
  if (res.status === 403) {
    const body = (await res.text()).slice(0, 300);
    throw new Error(`CryptoRank refused the call (403). Usually the endpoint is not in your plan tier or the monthly credit allowance is used up. Body: ${body}`);
  }
  if (res.status === 429) throw new Error('CryptoRank rate limit or credit limit reached (429).');
  if (!res.ok) throw new Error(`CryptoRank returned ${res.status}`);
  const raw = (await res.text()) as string;
  try {
    return JSON.parse(raw) as T;
  } catch {
    throw new Error(`CryptoRank returned a non-JSON body: ${raw.slice(0, 200)}`);
  }
}

const rkUsd = (v: unknown): string => {
  if (v === null || v === undefined || v === '') return 'n/a';
  const n = Number(v);
  if (!Number.isFinite(n)) return 'n/a';
  if (Math.abs(n) >= 1e12) return `$${(n / 1e12).toFixed(2)}T`;
  if (Math.abs(n) >= 1e9) return `$${(n / 1e9).toFixed(2)}B`;
  if (Math.abs(n) >= 1e6) return `$${(n / 1e6).toFixed(2)}M`;
  if (Math.abs(n) >= 1e3) return `$${(n / 1e3).toFixed(1)}K`;
  return `$${n.toFixed(2)}`;
};

export interface MarketSentimentArgs {
  record?: string;
}

/** The Crypto Fear & Greed index with its band spelled out, which is the one macro read the ranking tools do not give you. */
export async function marketSentiment(args: MarketSentimentArgs = {}): Promise<string> {
  const d = await rkGet<{ data?: { currentValue?: number; classification?: string }; status?: unknown }>('/global/fear-greed');
  const data = d.data ?? {};
  const value = Number(data.currentValue);
  if (!Number.isFinite(value)) throw new Error('CryptoRank returned a Fear & Greed payload with no currentValue.');
  const classification = String(data.classification ?? 'unclassified');
  const band = value <= 25 ? 'Extreme Fear' : value <= 45 ? 'Fear' : value <= 55 ? 'Neutral' : value <= 75 ? 'Greed' : 'Extreme Greed';
  const filled = Math.round(value / 5);
  const bar = '█'.repeat(filled) + '░'.repeat(20 - filled);

  const lines = [
    `Crypto Fear & Greed Index: ${value}/100 — ${classification}`,
    '',
    `${bar} 0 ${' '.repeat(17)} 100`,
    '',
    `Bands: 0-25 Extreme Fear, 26-45 Fear, 46-55 Neutral, 56-75 Greed, 76-100 Extreme Greed.`,
  ];
  if (band !== classification) {
    lines.push(`Note: CryptoRank labelled this ${classification}, but ${value} falls in the ${band} band by the documented thresholds, so their classification and the value disagree.`);
  }
  const reading =
    value <= 25 ? 'Sentiment is at the extreme-fear end, where prices often capitulate before recovering.'
    : value <= 45 ? 'Sentiment is fearful, which historically goes with sellers setting the price.'
    : value <= 55 ? 'Sentiment is neutral, so direction is being decided by flow rather than mood.'
    : value <= 75 ? 'Sentiment is greedy, which historically goes with stretched prices and thin conviction.'
    : 'Sentiment is at extreme greed, the zone where a single headline tends to move the market hardest.';
  lines.push(reading);
  if (args.record === 'true' || args.record === '1') {
    const chart = await rkGet<{ data?: Array<{ time?: number; value?: number; classification?: string }> }>('/global/fear-greed/chart?period=30d');
    const series = (chart.data ?? []).filter((p) => Number.isFinite(Number(p.value)));
    if (!series.length) {
      lines.push('', 'CryptoRank returned no Fear & Greed history for the last 30 days. The chart endpoint is a higher plan tier than the index itself, so this may be a plan limit rather than missing data.');
    } else {
      const first = series[0];
      const last = series[series.length - 1];
      const delta = Number(last.value) - Number(first.value);
      const dayOf = (p: { time?: number }): string => new Date(Number(p.time)).toISOString().slice(0, 10);
      lines.push(
        '',
        `Last 30 days: ${series.length} daily reading(s), from ${first.value} (${first.classification ?? '?'}) on ${dayOf(first)} to ${last.value} (${last.classification ?? '?'}) on ${dayOf(last)}, a move of ${delta >= 0 ? '+' : ''}${delta}.`,
      );
      const recent = series.slice(-14);
      lines.push('  ' + recent.map((p) => `${new Date(Number(p.time)).toISOString().slice(5, 10)}:${p.value}`).join('  '));
    }
  }
  return lines.join('\n');
}

const RK_PERIODS = ['24h', '7d', '30d'] as const;

export interface GainersLosersArgs {
  group?: string;
  period?: string;
  limit?: number;
  min_market_cap?: number;
}

/** Biggest risers and fallers over a chosen window, filtered to coins large enough to actually trade. */
export async function gainersLosers(args: GainersLosersArgs = {}): Promise<string> {
  const group = String(args.group ?? 'gainers').trim().toLowerCase();
  if (group !== 'gainers' && group !== 'losers') throw new Error('group must be gainers or losers.');
  const period = String(args.period ?? '24h').trim();
  if (!RK_PERIODS.includes(period as (typeof RK_PERIODS)[number])) {
    throw new Error(`period must be one of ${RK_PERIODS.join(', ')}.`);
  }
  const limit = Math.min(Math.max(Math.floor(args.limit ?? 10), 1), 50);
  const params = new URLSearchParams({ group, period });
  if (args.min_market_cap !== undefined && Number.isFinite(Number(args.min_market_cap))) {
    params.set('minMarketCap', String(Math.floor(Number(args.min_market_cap))));
  }
  const d = await rkGet<{ data?: any[] }>(`/currencies/gainers-losers?${params.toString()}`);
  const rows = (d.data ?? []).filter((r) => Number.isFinite(Number(r?.pricePercentChange)));
  if (!rows.length) {
    return `CryptoRank returned no ${group} over ${period}. It applies its own default floor of a 500,000 USD market cap and 1,000,000 USD 24h volume; a thin window can come back empty.`;
  }
  const shown = rows.slice(0, limit);
  const changes = rows.map((r) => Number(r.pricePercentChange));
  const width = Math.max(...shown.map((r) => String(r?.symbol ?? '?').length), 5);
  const lines = [
    `Top ${group} over ${period} on CryptoRank: ${rows.length} coin(s) passed its market-cap and volume filters`,
    `Move across this set: best ${Math.max(...changes).toFixed(2)}%, worst ${Math.min(...changes).toFixed(2)}%, median ${changes.slice().sort((a, b) => a - b)[Math.floor(changes.length / 2)].toFixed(2)}%`,
    '',
    `${"coin".padEnd(width + 12)}${"chg".padStart(9)}${"rank".padStart(6)}${"mcap".padStart(11)}  price`,
  ];
  for (const r of shown) {
    const chg = Number(r.pricePercentChange);
    const label = `${String(r?.symbol ?? '?').toUpperCase().padEnd(width)} ${String(r?.name ?? '?').slice(0, 12).padEnd(12)}`;
    lines.push(
      `${label}${`${chg >= 0 ? '+' : ''}${chg.toFixed(2)}%`.padStart(9)}` +
      `${(r?.rank != null ? `#${r.rank}` : '-').padStart(6)}${rkUsd(r?.marketCap).padStart(11)}  ${rkUsd(r?.price)}`,
    );
  }
  if (rows.length > shown.length) lines.push('', `...and ${rows.length - shown.length} more; raise limit to see them.`);
  const unranked = shown.filter((r) => r?.rank == null).length;
  if (unranked) lines.push(`${unranked} of these have no CryptoRank rank, so they are new or too small to be ranked rather than mispriced majors.`);
  return lines.join('\n');
}

export interface GlobalMarketArgs {
  record?: string;
}

/** One market-wide snapshot: total cap and volume, how much of the cap is BTC and ETH, and how many coins and venues are actually live. */
export async function globalMarket(args: GlobalMarketArgs = {}): Promise<string> {
  const d = await rkGet<{ data?: Record<string, any> }>('/global/market');
  const m = d.data ?? {};
  const total = Number(m.totalMarketCap);
  const volume = Number(m.totalVolume24h);
  const btc = Number(m.btcMarketCap);
  const eth = Number(m.ethMarketCap);
  const chg = Number(m.marketCapChangePercent24h);
  if (!Number.isFinite(total) || total <= 0) throw new Error('CryptoRank returned a market snapshot with no usable totalMarketCap.');

  const lines = [
    'Global crypto market snapshot (CryptoRank):',
    `  total market cap ${rkUsd(total)}${Number.isFinite(chg) ? `, ${chg >= 0 ? '+' : ''}${chg.toFixed(2)}% over 24h` : ''}`,
    `  24h spot volume ${rkUsd(volume)} (derivatives excluded), turnover ${Number.isFinite(volume) ? ((volume / total) * 100).toFixed(2) : '?'}% of cap`,
  ];
  if (Number.isFinite(btc)) lines.push(`  BTC cap ${rkUsd(btc)} — ${((btc / total) * 100).toFixed(2)}% of the market`);
  if (Number.isFinite(eth)) lines.push(`  ETH cap ${rkUsd(eth)} — ${((eth / total) * 100).toFixed(2)}% of the market`);
  if (Number.isFinite(btc) && Number.isFinite(eth)) {
    lines.push(`  BTC + ETH together hold ${(((btc + eth) / total) * 100).toFixed(2)}% of total cap, so the rest of the market is worth ${rkUsd(total - btc - eth)}.`);
  }
  lines.push(
    `  actively traded coins ${m.activeCurrencies ?? '?'} | live trading pairs ${m.activeTickers ?? '?'} | exchanges active in 24h ${m.activeExchanges ?? '?'}`,
  );
  if (args.record === 'true' || args.record === '1') {
    const dom = await rkGet<{ data?: Record<string, any> }>('/global/dominance');
    const values = (dom.data ?? {}) as Record<string, any>;
    const named = Object.entries(values).filter(([, v]) => Number.isFinite(Number(v)));
    if (named.length) {
      lines.push('', 'Dominance detail:');
      for (const [k, v] of named) lines.push(`  ${k}: ${Number(v).toFixed(2)}%`);
    } else {
      lines.push('', 'CryptoRank returned no dominance breakdown. The dominance endpoint is a higher plan tier, so this may be a plan limit.');
    }
  }
  return lines.join('\n');
}
