/**
 * LIFX HTTP API client. Needs LIFX_TOKEN (free at https://cloud.lifx.com/settings).
 * Docs: https://api.developer.lifx.com/docs/introduction
 */
const BASE = "https://api.lifx.com/v1"

export class LifxError extends Error {}

function headers(extra: Record<string, string> = {}): Record<string, string> {
  const token = process.env.LIFX_TOKEN
  if (!token) throw new LifxError("Set LIFX_TOKEN first (free at cloud.lifx.com/settings).")
  return { "User-Agent": "lifx-mcp/1.0", Accept: "application/json", Authorization: `Bearer ${token}`, ...extra }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Raw = Record<string, any>

async function getJson<T>(path: string): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    headers: headers(),
    signal: AbortSignal.timeout(20000),
  })
  if (res.status === 401 || res.status === 403) throw new LifxError("LIFX rejected the token (401/403).")
  if (!res.ok) throw new LifxError(`LIFX error ${res.status}`)
  return (await res.json()) as T
}

export interface Light {
  id: string
  label?: string
  power?: string
  brightness?: number
  connected?: boolean
  color?: string
}

export async function listLights(): Promise<Light[]> {
  const rows = await getJson<Raw[]>("/lights/all")
  return rows.map((l) => ({
    id: String(l.id),
    label: l.label,
    power: l.power,
    brightness: typeof l.brightness === "number" ? Math.round(l.brightness * 100) : undefined,
    connected: l.connected,
    color: l.color ? String(l.color.kelvin ? `${l.color.kelvin}K` : l.color.hue !== undefined ? `hue ${l.color.hue}` : "") || undefined : undefined,
  }))
}

export async function setPower(selector: string, power: "on" | "off" | "toggle", brightness = 1): Promise<string> {
  if (!selector.trim()) throw new LifxError("Selector is empty (use 'all', a label like 'label:Desk', or a group).")
  const res = await fetch(`${BASE}/lights/${encodeURIComponent(selector.trim())}/state`, {
    method: "PUT",
    headers: headers({ "Content-Type": "application/json" }),
    body: JSON.stringify({ power, brightness: Math.min(Math.max(brightness, 0), 1) }),
    signal: AbortSignal.timeout(20000),
  })
  if (res.status === 401 || res.status === 403) throw new LifxError("LIFX rejected the token (401/403).")
  if (!res.ok) throw new LifxError(`LIFX error ${res.status}`)
  return `Set ${selector.trim()} ${power}.`
}

export function formatLight(l: Light, index?: number): string {
  const prefix = index !== undefined ? `${index + 1}. ` : ""
  return `${prefix}[${l.id}] ${l.label ?? "(unnamed)"} — ${l.power ?? "?"}${l.brightness !== undefined ? ` ${l.brightness}%` : ""}${l.color ? ` ${l.color}` : ""}${l.connected === false ? " (offline)" : ""}`
}

// ---- muxB tools:

const LIFX_KELVIN_MIN = 2500
const LIFX_KELVIN_MAX = 9000

function lifxKelvinToRgb(kelvin: number): { r: number; g: number; b: number } {
  const t = Math.min(Math.max(kelvin, 1000), 40000) / 100
  let r: number
  let g: number
  let b: number
  if (t <= 66) {
    r = 255
    g = 99.4708025861 * Math.log(t) - 161.1195681661
  } else {
    r = 329.698727446 * Math.pow(t - 60, -0.1332047592)
    g = 288.1221695283 * Math.pow(t - 60, -0.0755148492)
  }
  if (t >= 66) b = 255
  else if (t <= 19) b = 0
  else b = 138.5177312231 * Math.log(t - 10) - 305.0447927307
  const clamp = (n: number) => Math.min(255, Math.max(0, Math.round(n)))
  return { r: clamp(r), g: clamp(g), b: clamp(b) }
}

function lifxRgbToHsv(r: number, g: number, b: number): { h: number; s: number; v: number } {
  const rn = r / 255
  const gn = g / 255
  const bn = b / 255
  const max = Math.max(rn, gn, bn)
  const min = Math.min(rn, gn, bn)
  const d = max - min
  let h = 0
  if (d !== 0) {
    if (max === rn) h = ((gn - bn) / d) % 6
    else if (max === gn) h = (bn - rn) / d + 2
    else h = (rn - gn) / d + 4
    h *= 60
    if (h < 0) h += 360
  }
  return { h, s: max === 0 ? 0 : d / max, v: max }
}

function lifxRgbToHsl(r: number, g: number, b: number): { h: number; s: number; l: number } {
  const rn = r / 255
  const gn = g / 255
  const bn = b / 255
  const max = Math.max(rn, gn, bn)
  const min = Math.min(rn, gn, bn)
  const l = (max + min) / 2
  const d = max - min
  if (d === 0) return { h: 0, s: 0, l }
  const s = d / (1 - Math.abs(2 * l - 1))
  const hsv = lifxRgbToHsv(r, g, b)
  return { h: hsv.h, s, l }
}

function lifxHex(r: number, g: number, b: number): string {
  return `#${[r, g, b].map((n) => n.toString(16).padStart(2, "0")).join("").toUpperCase()}`
}

function lifxParseHex(text: string): { r: number; g: number; b: number } | null {
  const m = /^#?([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(text.trim())
  if (!m) return null
  const hex = m[1].length === 3 ? m[1].replace(/./g, (c) => c + c) : m[1]
  return {
    r: parseInt(hex.slice(0, 2), 16),
    g: parseInt(hex.slice(2, 4), 16),
    b: parseInt(hex.slice(4, 6), 16),
  }
}

/** McCamy's cubic approximation, the standard way to get a CCT out of an sRGB triple. */
function lifxCct(r: number, g: number, b: number): number | null {
  const lin = (c: number) => {
    const n = c / 255
    return n <= 0.04045 ? n / 12.92 : Math.pow((n + 0.055) / 1.055, 2.4)
  }
  const rn = lin(r)
  const gn = lin(g)
  const bn = lin(b)
  const x = 0.4124 * rn + 0.3576 * gn + 0.1805 * bn
  const y = 0.2126 * rn + 0.7152 * gn + 0.0722 * bn
  const z = 0.0193 * rn + 0.1192 * gn + 0.9505 * bn
  const sum = x + y + z
  if (sum === 0) return null
  const n2 = (x / sum - 0.332) / (0.1858 - y / sum)
  const cct = 449 * n2 * n2 * n2 + 3525 * n2 * n2 + 6823.3 * n2 + 5520.33
  return cct > 1000 && cct < 20000 ? Math.round(cct) : null
}

export interface LifxColorArgs {
  kelvin?: number
  hex?: string
  hue?: number
  saturation?: number
  brightness?: number
}

export interface LifxScheduleArgs {
  keyframes: Array<{ at: string; kelvin: number; brightness: number }>
  start?: string
  end?: string
  step_minutes?: number
}

function lifxMinutes(hhmm: string): number | null {
  const m = /^(\d{1,2}):(\d{2})$/.exec(String(hhmm).trim())
  if (!m) return null
  const h = Number(m[1])
  const min = Number(m[2])
  if (h > 23 || min > 59) return null
  return h * 60 + min
}

function lifxLabel(minutes: number): string {
  const total = ((minutes % 1440) + 1440) % 1440
  return `${String(Math.floor(total / 60)).padStart(2, "0")}:${String(total % 60).padStart(2, "0")}`
}

export async function kelvinSchedule(args: LifxScheduleArgs): Promise<string> {
  const raw = Array.isArray(args.keyframes) ? args.keyframes : []
  const points: Array<{ at: number; kelvin: number; brightness: number }> = []
  for (const k of raw.slice(0, 24)) {
    const at = lifxMinutes(k.at ?? "")
    if (at === null) return `"${k.at}" is not a HH:MM time of day.`
    if (!Number.isFinite(k.kelvin) || !Number.isFinite(k.brightness)) return `Keyframe at ${k.at} needs both kelvin and brightness.`
    points.push({
      at,
      kelvin: Math.min(LIFX_KELVIN_MAX, Math.max(LIFX_KELVIN_MIN, Math.round(k.kelvin))),
      brightness: Math.min(Math.max(k.brightness, 0), 1),
    })
  }
  if (points.length < 2) return "Give at least two keyframes, e.g. [{at: '07:00', kelvin: 2700, brightness: 0.4}, {at: '22:00', kelvin: 2200, brightness: 0.1}]."
  points.sort((a, b) => a.at - b.at)
  const start = points[0].at
  const endArg = args.end ? lifxMinutes(args.end) : null
  if (args.end && endArg === null) return `"${args.end}" is not a HH:MM time of day.`
  const end = endArg !== null && endArg > start ? endArg : start + 24 * 60
  const step = Math.min(Math.max(Math.round(args.step_minutes ?? 60), 5), 720)
  const at = (mins: number): { kelvin: number; brightness: number } => {
    const first = points[0]
    const last = points[points.length - 1]
    if (mins <= first.at) return { kelvin: first.kelvin, brightness: first.brightness }
    if (mins >= last.at) return { kelvin: last.kelvin, brightness: last.brightness }
    for (let i = 0; i < points.length - 1; i++) {
      const a = points[i]
      const b = points[i + 1]
      if (mins >= a.at && mins <= b.at) {
        const span = b.at - a.at
        const t = span === 0 ? 0 : (mins - a.at) / span
        return {
          kelvin: Math.round(a.kelvin + (b.kelvin - a.kelvin) * t),
          brightness: a.brightness + (b.brightness - a.brightness) * t,
        }
      }
    }
    return { kelvin: last.kelvin, brightness: last.brightness }
  }
  const rows: string[] = []
  let minTemp = Infinity
  let maxTemp = -Infinity
  for (let m = start; m <= end; m += step) {
    const v = at(m)
    minTemp = Math.min(minTemp, v.kelvin)
    maxTemp = Math.max(maxTemp, v.kelvin)
    const rgb = lifxKelvinToRgb(v.kelvin)
    const label = lifxLabel(m) + (m >= 1440 ? ` (+${Math.floor(m / 1440)}d)` : "")
    rows.push(`${label}  ${String(v.kelvin).padStart(4)}K  ${(v.brightness * 100).toFixed(0).padStart(3)}%  ${lifxHex(rgb.r, rgb.g, rgb.b)}`)
  }
  return [
    `Colour temperature plan from ${lifxLabel(start)} over ${((end - start) / 60).toFixed(1)} h${endArg !== null ? `, ending ${lifxLabel(end)}` : ""}, interpolated every ${step} min across ${points.length} keyframes.`,
    `Range: ${minTemp}K to ${maxTemp}K. Bulbs clamp outside ${LIFX_KELVIN_MIN}-${LIFX_KELVIN_MAX}K.`,
    "",
    "time    kelvin  level  rendered",
    ...rows,
  ].join("\n")
}
