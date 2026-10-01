const UA = "mrfentmen-unit-converter-mcp/1.0"
export class UnitError extends Error {}

// Each unit maps to a factor of the category base unit.
const CATEGORIES: Record<string, Record<string, number>> = {
  length: { m: 1, km: 1000, cm: 0.01, mm: 0.001, mi: 1609.344, yd: 0.9144, ft: 0.3048, in: 0.0254 },
  weight: { kg: 1, g: 0.001, mg: 0.000001, lb: 0.45359237, oz: 0.028349523125, t: 1000, st: 6.35029318 },
  temperature: { c: 1, f: 1, k: 1 }, // special handled
  speed: { mps: 1, kmh: 1 / 3.6, mph: 0.44704, kn: 0.514444, fps: 0.3048 },
  data: { b: 1, kb: 1000, mb: 1e6, gb: 1e9, tb: 1e12, kib: 1024, mib: 1048576, gib: 1073741824, tib: 1099511627776 },
}

const CATEGORY_ALIAS: Record<string, string> = {
  length: "length", distance: "length",
  weight: "weight", mass: "weight",
  temperature: "temperature", temp: "temperature",
  speed: "speed", velocity: "speed",
  data: "data", storage: "data", "data size": "data",
}

const UNIT_ALIAS: Record<string, string> = {
  m: "m", meter: "m", meters: "m", metre: "m",
  km: "km", kilometer: "km",
  cm: "cm", mm: "mm", mi: "mi", mile: "mi", miles: "mi",
  ft: "ft", foot: "ft", feet: "ft", yd: "yd", yard: "yd", in: "in", inch: "in", inches: "in",
  kg: "kg", kilogram: "kg", g: "g", gram: "g", mg: "mg", lb: "lb", pound: "lb", pounds: "lb",
  oz: "oz", ounce: "oz", t: "t", tonne: "t", ton: "t",
  c: "c", celsius: "c", f: "f", fahrenheit: "f", k: "k", kelvin: "k",
  mps: "mps", "m/s": "mps", kmh: "kmh", "km/h": "kmh", mph: "mph", kn: "kn", knot: "kn", fps: "fps",
  b: "b", byte: "b", bytes: "b", kb: "kb", mb: "mb", gb: "gb", tb: "tb", kib: "kib", mib: "mib", gib: "gib", tib: "tib",
}

function findCategory(unit: string): { cat: string; u: string } | null {
  const u = UNIT_ALIAS[unit.toLowerCase()]
  if (!u) return null
  for (const [cat, units] of Object.entries(CATEGORIES)) {
    if (units[u] !== undefined) return { cat, u }
  }
  return null
}

function toBase(cat: string, u: string, v: number): number {
  if (cat === "temperature") {
    if (u === "c") return v
    if (u === "f") return (v - 32) * 5 / 9
    return v - 273.15
  }
  return v * CATEGORIES[cat][u]
}

function fromBase(cat: string, u: string, v: number): number {
  if (cat === "temperature") {
    if (u === "c") return v
    if (u === "f") return v * 9 / 5 + 32
    return v + 273.15
  }
  return v / CATEGORIES[cat][u]
}

export async function convert(args: { value?: number; from?: string; to?: string }): Promise<string> {
  const value = args.value
  const fromRaw = (args.from ?? "").trim()
  const toRaw = (args.to ?? "").trim()
  if (value === undefined || !fromRaw || !toRaw) throw new UnitError("Provide a value, a source unit, and a target unit")
  const from = findCategory(fromRaw)
  const to = findCategory(toRaw)
  if (!from || !to) throw new UnitError(`Unknown unit. Try list_units first`)
  if (from.cat !== to.cat) throw new UnitError(`Cannot convert ${fromRaw} to ${toRaw}. Categories differ`)
  const base = toBase(from.cat, from.u, value)
  const out = fromBase(from.cat, to.u, base)
  const fmt = (v: number) => Number.isInteger(v) ? String(v) : v.toPrecision(8).replace(/0+$/, "").replace(/\.$/, "")
  return `${value} ${fromRaw} = ${fmt(out)} ${toRaw} (${from.cat})`
}

export async function listUnits(args: { category?: string }): Promise<string> {
  const catRaw = (args.category ?? "").trim().toLowerCase()
  if (catRaw) {
    const cat = CATEGORY_ALIAS[catRaw]
    if (!cat) throw new UnitError(`Category must be one of ${Object.keys(CATEGORIES).join(", ")}`)
    return `Units for ${cat}:\n${Object.keys(CATEGORIES[cat]).join(", ")}`
  }
  return `Categories:\n${Object.keys(CATEGORIES).join("\n")}`
}

// ---- muxC tools:

