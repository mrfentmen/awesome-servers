/**
 * Alpha Vantage API client. Needs ALPHAVANTAGE_API_KEY
 * (free at https://www.alphavantage.co/support/#api-key, rate-limited tier).
 * Docs: https://www.alphavantage.co/documentation/
 */
const BASE = "https://www.alphavantage.co/query"

export class AlphaVantageError extends Error {}

function apiKey(): string {
  const k = process.env.ALPHAVANTAGE_API_KEY
  if (!k) throw new AlphaVantageError("Set ALPHAVANTAGE_API_KEY first (free at alphavantage.co/support/#api-key).")
  return k
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Raw = Record<string, any>

async function getJson(params: Record<string, string>): Promise<Raw> {
  const qs = new URLSearchParams({ ...params, apikey: apiKey() }).toString()
  const res = await fetch(`${BASE}?${qs}`, {
    headers: { "User-Agent": "alphavantage-mcp/1.0", Accept: "application/json" },
    signal: AbortSignal.timeout(25000),
  })
  if (!res.ok) throw new AlphaVantageError(`Alpha Vantage error ${res.status}`)
  const data = (await res.json()) as Raw
  if (data.Note) throw new AlphaVantageError("Alpha Vantage rate limit hit (free tier is 25/day). Try later.")
  if (data["Error Message"]) throw new AlphaVantageError(`Alpha Vantage: ${String(data["Error Message"]).slice(0, 160)}`)
  return data
}

export async function stockQuote(symbol: string): Promise<string> {
  if (!symbol.trim()) throw new AlphaVantageError("Symbol is empty.")
  const data = await getJson({ function: "GLOBAL_QUOTE", symbol: symbol.trim().toUpperCase() })
  const q: Raw = data["Global Quote"] ?? {}
  if (!q["05. price"]) throw new AlphaVantageError(`No quote for ${symbol.trim().toUpperCase()}.`)
  return [
    `${symbol.trim().toUpperCase()} — $${q["05. price"]}`,
    `Open ${q["02. open"] ?? "?"} · High ${q["03. high"] ?? "?"} · Low ${q["04. low"] ?? "?"}`,
    `Change: ${q["09. change"] ?? "?"} (${q["10. change percent"] ?? "?"})`,
    `Volume: ${Number(q["06. volume"] ?? 0).toLocaleString()} · Trading day: ${q["07. latest trading day"] ?? "?"}`,
  ].join("\n")
}

export async function fxRate(from: string, to: string): Promise<string> {
  if (!from.trim() || !to.trim()) throw new AlphaVantageError("Currencies are empty.")
  const data = await getJson({ function: "CURRENCY_EXCHANGE_RATE", from_currency: from.trim().toUpperCase(), to_currency: to.trim().toUpperCase() })
  const r: Raw = data["Realtime Currency Exchange Rate"] ?? {}
  if (!r["5. Exchange Rate"]) throw new AlphaVantageError(`No rate for ${from}/${to}.`)
  return `1 ${from.trim().toUpperCase()} = ${r["5. Exchange Rate"]} ${to.trim().toUpperCase()} (as of ${r["6. Last Refreshed"] ?? "?"})`
}

export async function cryptoPrice(symbol: string, market = "USD"): Promise<string> {
  if (!symbol.trim()) throw new AlphaVantageError("Symbol is empty.")
  const data = await getJson({ function: "CURRENCY_EXCHANGE_RATE", from_currency: symbol.trim().toUpperCase(), to_currency: market.trim().toUpperCase() })
  const r: Raw = data["Realtime Currency Exchange Rate"] ?? {}
  if (!r["5. Exchange Rate"]) throw new AlphaVantageError(`No price for ${symbol}.`)
  return `${symbol.trim().toUpperCase()}/${market.trim().toUpperCase()}: ${r["5. Exchange Rate"]}`
}

export async function symbolSearch(keywords: string): Promise<string[]> {
  if (!keywords.trim()) throw new AlphaVantageError("Keywords are empty.")
  const data = await getJson({ function: "SYMBOL_SEARCH", keywords: keywords.trim() })
  const rows: Raw[] = Array.isArray(data.bestMatches) ? data.bestMatches : []
  return rows.slice(0, 8).map((m) => `${m["1. symbol"]} — ${m["2. name"]} (${m["3. type"]}, ${m["4. region"]})`)
}

// ---- muxH tools:
// All four tools above need ALPHAVANTAGE_API_KEY, which is not set here. These two
// read the company's own public demo key, which the documentation publishes for
// exactly this purpose, and it serves the fund-raising and price-history families
// even while refusing the quote, search and exchange-rate families the older tools
// call. That split is checked at the top of each, so a refusal is a real error
// rather than a silently empty answer.

const AV_BASE = "https://www.alphavantage.co/query";
const AV_UA = "alphavantage-mcp/1.1 (contactae2000@gmail.com)";
/** The key Alpha Vantage publishes for demonstration; it is not a secret of ours. */
const AV_DEMO = "demo";

interface AvSeries {
  "1. open"?: string;
  "2. high"?: string;
  "3. low"?: string;
  "4. close"?: string;
  "5. volume"?: string;
}

async function avQuery<T>(params: Record<string, string>, label: string): Promise<T> {
  let res: Response;
  const qs = new URLSearchParams({ ...params, apikey: AV_DEMO }).toString();
  try {
    res = await fetch(`${AV_BASE}?${qs}`, {
      headers: { "User-Agent": AV_UA, Accept: "application/json" },
      signal: AbortSignal.timeout(25000),
    });
  } catch (e) {
    throw new AlphaVantageError(`Could not reach Alpha Vantage: ${(e as Error).message}`);
  }
  if (!res.ok) throw new AlphaVantageError(`${label} returned HTTP ${res.status}.`);
  const body = (await res.json()) as Record<string, unknown>;
  // The demo key answers a refused family with a 200 and an apology in the body.
  const refusal = body.Note ?? body.Information ?? body["Error Message"];
  if (refusal) {
    throw new AlphaVantageError(
      `${label} is not served by the public demo key: ${String(refusal).slice(0, 200)}`,
    );
  }
  return body as T;
}

const avNum = (raw: unknown): number => {
  const n = Number(String(raw ?? "").replace(/[,%]/g, ""));
  return Number.isFinite(n) ? n : 0;
};
const avBn = (raw: unknown): string => {
  const n = avNum(raw);
  if (!n) return "not reported";
  if (n >= 1e12) return `${(n / 1e12).toFixed(2)}T`;
  if (n >= 1e9) return `${(n / 1e9).toFixed(2)}B`;
  if (n >= 1e6) return `${(n / 1e6).toFixed(2)}M`;
  return n.toLocaleString();
};
const avMoney = (raw: unknown, currency: string): string => {
  const n = avNum(raw);
  if (!n) return "not reported";
  return `${currency === "USD" ? "$" : ""}${n.toLocaleString(undefined, { maximumFractionDigits: 3 })}`;
};

/**
 * A company's own fundamentals as Alpha Vantage reports them: sector, industry,
 * market capitalisation, the profitability and balance-sheet ratios, the
 * dividend, earnings dates and its description. The four existing tools all read a
 * live price, and none of them says what the company is.
 */
export async function companyProfile(args: { symbol: string }): Promise<string> {
  const symbol = String(args?.symbol ?? "").trim().toUpperCase();
  if (!symbol) throw new AlphaVantageError("Give a symbol, e.g. IBM or AAPL.");
  const d = await avQuery<Record<string, string>>({ function: "OVERVIEW", symbol }, `The OVERVIEW call for ${symbol}`);
  if (!d.Symbol) throw new AlphaVantageError(`Alpha Vantage returned no OVERVIEW record for ${symbol}.`);

  const currency = d.Currency || "not reported";
  const ratio = (label: string, value?: string, suffix = ""): string =>
    value ? `  ${label.padEnd(26)}${value}${suffix}` : "";

  return [
    `Company profile for ${d.Name ?? symbol} (${d.Symbol})`,
    `  ${d.AssetType ?? "asset type not reported"} | ${d.Exchange ?? "exchange not reported"} | ${d.Currency ?? "not reported"}`,
    `  ${d.Sector ?? "sector not reported"} / ${d.Industry ?? "industry not reported"} | ${d.Country ?? "country not reported"}`,
    d.CIK ? `  CIK ${d.CIK} | fiscal year ends ${d.FiscalYearEnd ?? "not reported"} | latest quarter ${d.LatestQuarter ?? "not reported"}` : "  CIK not reported",
    "",
    "Size and valuation:",
    ratio("market capitalisation", d.MarketCapitalization ? avMoney(d.MarketCapitalization, currency) : undefined),
    ratio("EBITDA", d.EBITITDA ? avMoney(d.EBITITDA, currency) : undefined),
    ratio("P/E ratio", d.PERatio),
    ratio("PEG ratio", d.PEGRatio),
    ratio("price to book", d.PriceToBookRatio),
    ratio("book value per share", d.BookValue ? avMoney(d.BookValue, currency) : undefined),
    "",
    "Per share:",
    ratio("EPS", d.EPS ? avMoney(d.EPS, currency) : undefined),
    ratio("dividend per share", d.DividendPerShare ? avMoney(d.DividendPerShare, currency) : undefined),
    ratio("dividend yield", d.DividendYield ? `${d.DividendYield}%` : undefined),
    "",
    "Profitability and health:",
    ratio("profit margin", d.ProfitMargin ? `${d.ProfitMargin}%` : undefined),
    ratio("operating margin", d.OperatingMarginTTM ? `${d.OperatingMarginTTM}%` : undefined),
    ratio("return on assets", d.ReturnOnAssetsTTM ? `${d.ReturnOnAssetsTTM}%` : undefined),
    ratio("return on equity", d.ReturnOnEquityTTM ? `${d.ReturnOnEquityTTM}%` : undefined),
    ratio("revenue TTM", d.RevenueTTM ? avMoney(d.RevenueTTM, currency) : undefined),
    ratio("gross profit TTM", d.GrossProfitTTM ? avMoney(d.GrossProfitTTM, currency) : undefined),
    ratio("debt / equity", d.DebtToEquity),
    ratio("current ratio", d.CurrentRatio),
    ratio("quick ratio", d.QuickRatio),
    ratio("52-week high", d.FiftyTwoWeekHigh ? avMoney(d.FiftyTwoWeekHigh, currency) : undefined),
    ratio("52-week low", d.FiftyTwoWeekLow ? avMoney(d.FiftyTwoWeekLow, currency) : undefined),
    "",
    d.Description ? `Description: ${String(d.Description).replace(/\s+/g, " ").slice(0, 420)}${String(d.Description).length > 420 ? " …" : ""}` : "Description: not published",
    d.OfficialSite ? `Site: ${d.OfficialSite} | ${d.Address ?? "address not reported"}` : "",
    "",
    "These are Alpha Vantage's own derived figures, refreshed on its schedule rather than at the moment of this call, and several of them are undefined for most companies rather than zero, which is why an absent line is printed as absent. Percentages are given as the service writes them, so a negative margin carries its own sign. A market capitalisation here is not a price you can trade at.",
  ]
    .filter(Boolean)
    .join("\n");
}

/**
 * A symbol's own price history, read from the daily or intraday series: the
 * window's high, low, close and range, a mean and how far the last close sits from
 * it, the traded volume, and the most recent days. A quote says where the price is;
 * this says where it has been and how wide the range has been.
 */
export async function priceHistory(args: { symbol: string; days?: number; interval?: string }): Promise<string> {
  const symbol = String(args?.symbol ?? "").trim().toUpperCase();
  if (!symbol) throw new AlphaVantageError("Give a symbol, e.g. IBM or AAPL.");
  const days = Math.min(Math.max(Number(args?.days ?? 30) || 30, 5), 120);
  const interval = String(args?.interval ?? "daily").trim().toLowerCase();
  const wantIntraday = interval !== "daily";
  const avInterval = ["5min", "15min", "30min", "60min"].includes(interval) ? interval : "daily";

  const params: Record<string, string> = wantIntraday
    ? { function: "TIME_SERIES_INTRADAY", symbol, interval: avInterval }
    : { function: "TIME_SERIES_DAILY", symbol, outputsize: "full" };
  const raw = await avQuery<Record<string, unknown>>(params, `The ${wantIntraday ? "intraday" : "daily"} series for ${symbol}`);

  const seriesKey = wantIntraday ? `Time Series (${avInterval})` : "Time Series (Daily)";
  const series = (raw[seriesKey] ?? {}) as Record<string, AvSeries>;
  const stamps = Object.keys(series).sort();
  if (!stamps.length) throw new AlphaVantageError(`Alpha Vantage returned an empty ${seriesKey} for ${symbol}.`);

  const window = stamps.slice(-days);
  const rows = window.map((stamp) => {
    const row = series[stamp];
    return {
      stamp,
      open: avNum(row["1. open"]),
      high: avNum(row["2. high"]),
      low: avNum(row["3. low"]),
      close: avNum(row["4. close"]),
      volume: avNum(row["5. volume"]),
    };
  });
  const closes = rows.map((r) => r.close).filter((c) => c > 0);
  if (!closes.length) throw new AlphaVantageError(`The ${seriesKey} for ${symbol} carries no usable closing prices.`);

  const high = rows.reduce((a, b) => (b.high > a.high ? b : a));
  const low = rows.reduce((a, b) => (b.low < a.low ? b : a));
  const mean = closes.reduce((a, b) => a + b, 0) / closes.length;
  const last = rows[rows.length - 1];
  const volume = rows.reduce((s, r) => s + r.volume, 0);
  const sd = Math.sqrt(closes.reduce((s, c) => s + (c - mean) ** 2, 0) / closes.length);

  return [
    `Price history for ${symbol} — ${wantIntraday ? `intraday, ${avInterval} bars` : "daily closes"}`,
    `  ${rows.length} bar(s) from ${window[0]} to ${window[window.length - 1]}`,
    `  series last refreshed ${String((raw["Meta Data"] as Record<string, string> | undefined)?.["3. Last Refreshed"] ?? "not reported")} in ${String((raw["Meta Data"] as Record<string, string> | undefined)?.["5. Time Zone"] ?? "timezone not reported")}`,
    "",
    `  highest close ${high.stamp} ${high.close} | lowest close ${low.stamp} ${low.close}`,
    `  window range ${(high.close - low.close).toFixed(3)}, which is ${(((high.close - low.close) / mean) * 100).toFixed(1)}% of the mean close`,
    `  mean close ${mean.toFixed(3)}, standard deviation ${sd.toFixed(3)}, so a typical bar sits within about ${sd.toFixed(3)} of it`,
    `  last bar ${last.stamp}: open ${last.open} high ${last.high} low ${last.low} close ${last.close} volume ${last.volume.toLocaleString()}`,
    volume ? `  total volume across the window ${avBn(volume)}, mean per bar ${Math.round(volume / rows.length).toLocaleString()}` : "  volume not reported in this series",
    `  last close is ${(((last.close - mean) / mean) * 100).toFixed(1)}% ${last.close >= mean ? "above" : "below"} the window mean`,
    "",
    "Most recent bars, newest last:",
    ...rows.slice(-12).map((r) => `  ${r.stamp}  O ${r.open}  H ${r.high}  L ${r.low}  C ${r.close}  vol ${r.volume.toLocaleString()}`),
    "",
    "Prices are as the service last refreshed them, not as of this call, and the daily series is split or dividend adjusted according to how the exchange reports it, which the payload does not state. A daily bar is the exchange's own aggregation, so its high and low are intraday extremes and its volume is that session's, not a closing print. The standard deviation is a simple one over the window, not an annualised volatility.",
  ].join("\n");
}
