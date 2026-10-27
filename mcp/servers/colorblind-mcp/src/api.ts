/**
 * Colour Blindness — keyless public API client.
 */
const BASE = "https://example.invalid"
const SOURCE = "Colour Blindness"

export class SourceError extends Error {}

async function request(path: string, accept = "application/json", timeoutMs = 25000): Promise<Response> {
  const ctrl = new AbortController()
  const timer = setTimeout(() => ctrl.abort(), timeoutMs)
  try {
    const res = await fetch(path.startsWith("http") ? path : BASE + path, {
      signal: ctrl.signal,
      headers: { "user-agent": "colorblind-mcp", accept },
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

type RGB = [number, number, number]

function parseHex(raw: string): RGB {
  const m = raw.trim().match(/^#?([0-9a-f]{3}|[0-9a-f]{6})$/i)
  if (!m) throw new SourceError(`"${raw}" is not a hex colour like #3366ff`)
  const h = m[1].length === 3 ? m[1].split("").map((c) => c + c).join("") : m[1]
  return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)]
}

const toHex = (c: RGB): string => "#" + c.map((v) => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, "0")).join("")

const linear = (v: number): number => {
  const s = v / 255
  return s <= 0.04045 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4)
}

function toLab(c: RGB): [number, number, number] {
  const [r, g, b] = c.map(linear)
  const x = (r * 0.4124 + g * 0.3576 + b * 0.1805) / 0.95047
  const y = r * 0.2126 + g * 0.7152 + b * 0.0722
  const z = (r * 0.0193 + g * 0.1192 + b * 0.9505) / 1.08883
  const f = (t: number): number => (t > 0.008856 ? Math.cbrt(t) : 7.787 * t + 16 / 116)
  return [116 * f(y) - 16, 500 * (f(x) - f(y)), 200 * (f(y) - f(z))]
}

function simulate(c: RGB, type: string): RGB {
  const [r, g, b] = c
  switch (type) {
    case "protanopia":
      return [0.567 * r + 0.433 * g, 0.558 * r + 0.442 * g, 0.242 * g + 0.758 * b]
    case "deuteranopia":
      return [0.625 * r + 0.375 * g, 0.7 * r + 0.3 * g, 0.3 * g + 0.7 * b]
    case "tritanopia":
      return [0.95 * r + 0.05 * g, 0.433 * g + 0.567 * b, 0.475 * g + 0.525 * b]
    case "achromatopsia": {
      const y = 0.2126 * r + 0.7152 * g + 0.0722 * b
      return [y, y, y]
    }
    default:
      throw new SourceError(`unknown deficiency "${type}"`)
  }
}

const distance = (a: RGB, b: RGB): number => {
  const [l1, a1, b1] = toLab(a)
  const [l2, a2, b2] = toLab(b)
  return Math.sqrt((l1 - l2) ** 2 + (a1 - a2) ** 2 + (b1 - b2) ** 2)
}

export async function simulateColor(a: { hex: string; type: string }): Promise<string> {
  const c = parseHex(a.hex)
  const sim = simulate(c, a.type)
  return [
    `Original: ${toHex(c)}  rgb(${c.join(", ")})`,
    `${a.type}: ${toHex(sim)}  rgb(${sim.map((v) => Math.round(v)).join(", ")})`,
    `Perceptual shift: ${distance(c, sim).toFixed(1)} deltaE`,
  ].join("\n")
}

export async function simulatePalette(a: { colors: string[]; type?: string }): Promise<string> {
  const type = a.type ?? "deuteranopia"
  const sims = a.colors.map((h) => simulate(parseHex(h), type))
  const rows = a.colors.map((h, i) => `${h} -> ${toHex(sims[i])}`)
  const clashes: string[] = []
  for (let i = 0; i < sims.length; i++) {
    for (let j = i + 1; j < sims.length; j++) {
      const d = distance(sims[i], sims[j])
      if (d < 10) clashes.push(`${a.colors[i]} and ${a.colors[j]} collapse (deltaE ${d.toFixed(1)})`)
    }
  }
  return [
    `${type} simulation of ${a.colors.length} colours:`,
    ...rows,
    clashes.length ? "Risky pairs:" : "No pairs collapse below deltaE 10.",
    ...clashes,
  ].join("\n")
}

export async function colorDistance(a: { first: string; second: string; type?: string }): Promise<string> {
  const type = a.type ?? "deuteranopia"
  const x = parseHex(a.first)
  const y = parseHex(a.second)
  const before = distance(x, y)
  const after = distance(simulate(x, type), simulate(y, type))
  return [
    `Original distance: ${before.toFixed(1)} deltaE`,
    `After ${type}: ${after.toFixed(1)} deltaE`,
    after < 10 ? "These colours become hard to distinguish." : "These colours stay distinguishable.",
  ].join("\n")
}
