/**
 * Statistics — keyless public API client.
 */
const BASE = "https://example.invalid"
const SOURCE = "Statistics"

export class SourceError extends Error {}

async function request(path: string, accept = "application/json", timeoutMs = 25000): Promise<Response> {
  const ctrl = new AbortController()
  const timer = setTimeout(() => ctrl.abort(), timeoutMs)
  try {
    const res = await fetch(path.startsWith("http") ? path : BASE + path, {
      signal: ctrl.signal,
      headers: { "user-agent": "statistics-mcp", accept },
    })
    if (!res.ok) throw new SourceError(`${SOURCE} responded ${res.status}`)
    return res
  } catch (e) {
    if (e instanceof SourceError) throw e
    if ((e as Error).name === "AbortError") throw new SourceError(`${SOURCE} request timed out`)
    throw new SourceError(`${SOURCE} request failed: ${(e as Error).message}`)
  } finally {
    clearTimeout(timer)
  }
}

export async function getJson(path: string): Promise<any> {
  const res = await request(path)
  const body = await res.text()
  try {
    return JSON.parse(body)
  } catch {
    throw new SourceError(`${SOURCE} returned malformed JSON`)
  }
}

export async function getText(path: string, accept = "text/plain"): Promise<string> {
  const res = await request(path, accept)
  return (await res.text()).trim()
}

export function clampLimit(n: number | undefined, fallback: number, max: number): number {
  const v = n ?? fallback
  if (!Number.isInteger(v) || v < 1 || v > max) throw new SourceError(`limit must be between 1 and ${max}`)
  return v
}

export function clean(s: unknown): string {
  return String(s ?? "").replace(/\s+/g, " ").trim()
}

export function bullet(label: string, value: unknown): string {
  const v = value === undefined || value === null || value === "" ? "" : String(value)
  return v ? `${label}: ${v}` : ""
}

export function section(title: string, rows: string[]): string {
  return [title, ...rows.filter(Boolean)].join("\n")
}

function checkLength(xs: number[], ys: number[]): void {
  if (xs.length !== ys.length) throw new SourceError(`series lengths differ (${xs.length} vs ${ys.length})`)
  if (xs.some((v) => !Number.isFinite(v)) || ys.some((v) => !Number.isFinite(v))) throw new SourceError("series contain a non-finite number")
}

const round = (n: number): string => String(Math.round(n * 1e6) / 1e6)

function quantile(sorted: number[], p: number): number {
  const pos = (sorted.length - 1) * p
  const lo = Math.floor(pos)
  const hi = Math.ceil(pos)
  return sorted[lo] + (sorted[hi] - sorted[lo]) * (pos - lo)
}

export async function describeSample(a: { values: number[] }): Promise<string> {
  if (a.values.some((v) => !Number.isFinite(v))) throw new SourceError("sample contains a non-finite number")
  const s = [...a.values].sort((x, y) => x - y)
  const n = s.length
  const mean = s.reduce((t, v) => t + v, 0) / n
  const variance = s.reduce((t, v) => t + (v - mean) ** 2, 0) / (n - 1)
  const sd = Math.sqrt(variance)
  const q1 = quantile(s, 0.25)
  const q3 = quantile(s, 0.75)
  const iqr = q3 - q1
  const outliers = s.filter((v) => v < q1 - 1.5 * iqr || v > q3 + 1.5 * iqr)
  return [
    `n: ${n}`,
    `mean: ${round(mean)}`,
    `median: ${round(quantile(s, 0.5))}`,
    `min / max: ${round(s[0])} / ${round(s[n - 1])}`,
    `range: ${round(s[n - 1] - s[0])}`,
    `Q1 / Q3: ${round(q1)} / ${round(q3)}  (IQR ${round(iqr)})`,
    `standard deviation: ${round(sd)} (sample)`,
    `variance: ${round(variance)}`,
    `outliers (1.5 IQR): ${outliers.length ? outliers.map(round).join(", ") : "none"}`,
  ].join("\n")
}

export async function correlate(a: { xs: number[]; ys: number[] }): Promise<string> {
  checkLength(a.xs, a.ys)
  const n = a.xs.length
  const mx = a.xs.reduce((t, v) => t + v, 0) / n
  const my = a.ys.reduce((t, v) => t + v, 0) / n
  let num = 0, dx = 0, dy = 0
  for (let i = 0; i < n; i++) {
    num += (a.xs[i] - mx) * (a.ys[i] - my)
    dx += (a.xs[i] - mx) ** 2
    dy += (a.ys[i] - my) ** 2
  }
  const pearson = dx === 0 || dy === 0 ? NaN : num / Math.sqrt(dx * dy)
  const rank = (v: number[]): number[] => {
    const sorted = v.map((x, i) => ({ x, i })).sort((p, q) => p.x - q.x)
    const r = Array(v.length).fill(0)
    for (let i = 0; i < sorted.length; i++) r[sorted[i].i] = i + 1
    return r
  }
  const rx = rank(a.xs), ry = rank(a.ys)
  const mrx = rx.reduce((t, v) => t + v, 0) / n
  const mry = ry.reduce((t, v) => t + v, 0) / n
  let sn = 0, sx = 0, sy = 0
  for (let i = 0; i < n; i++) {
    sn += (rx[i] - mrx) * (ry[i] - mry)
    sx += (rx[i] - mrx) ** 2
    sy += (ry[i] - mry) ** 2
  }
  const spearman = sx === 0 || sy === 0 ? NaN : sn / Math.sqrt(sx * sy)
  return [
    `n: ${n}`,
    `Pearson r: ${Number.isNaN(pearson) ? "undefined (a series is constant)" : round(pearson)}`,
    `Spearman rho: ${Number.isNaN(spearman) ? "undefined" : round(spearman)}`,
    `R squared: ${Number.isNaN(pearson) ? "undefined" : round(pearson ** 2)}`,
  ].join("\n")
}

export async function linearRegression(a: { xs: number[]; ys: number[] }): Promise<string> {
  checkLength(a.xs, a.ys)
  const n = a.xs.length
  const mx = a.xs.reduce((t, v) => t + v, 0) / n
  const my = a.ys.reduce((t, v) => t + v, 0) / n
  let sxy = 0, sxx = 0, syy = 0
  for (let i = 0; i < n; i++) {
    sxy += (a.xs[i] - mx) * (a.ys[i] - my)
    sxx += (a.xs[i] - mx) ** 2
    syy += (a.ys[i] - my) ** 2
  }
  if (sxx === 0) throw new SourceError("predictor values are all identical, so no line can be fitted")
  const slope = sxy / sxx
  const intercept = my - slope * mx
  const ssRes = a.ys.reduce((t, y, i) => t + (y - (intercept + slope * a.xs[i])) ** 2, 0)
  const r2 = syy === 0 ? 1 : 1 - ssRes / syy
  const se = n > 2 ? Math.sqrt(ssRes / (n - 2)) : NaN
  return [
    `y = ${round(intercept)} + ${round(slope)}x`,
    `slope: ${round(slope)}`,
    `intercept: ${round(intercept)}`,
    `R squared: ${round(r2)}`,
    `residual standard error: ${Number.isNaN(se) ? "n/a (need n > 2)" : round(se)}`,
    `n: ${n}`,
  ].join("\n")
}
