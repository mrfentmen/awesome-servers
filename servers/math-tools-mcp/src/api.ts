
export class MathError extends Error {}

function gcd(a: number, b: number): number {
  a = Math.abs(a)
  b = Math.abs(b)
  while (b) { const t = b; b = a % b; a = t }
  return a
}

export async function primeFactors(args: { value?: number }): Promise<string> {
  let n = args.value
  if (n === undefined || !Number.isInteger(n) || Math.abs(n) > 1e12 || n < 2) {
    throw new MathError("Provide an integer between 2 and 1,000,000,000,000")
  }
  if (n === 2) return "2 = 2"
  const factors: Array<[number, number]> = []
  let x = Math.abs(n)
  let d = 2
  while (d * d <= x) {
    let count = 0
    while (x % d === 0) { x /= d; count++ }
    if (count) factors.push([d, count])
    d = d === 2 ? 3 : d + 2
  }
  if (x > 1) factors.push([x, 1])
  const parts = factors.map(([p, c]) => c === 1 ? String(p) : `${p}^${c}`)
  return `${n} = ${parts.join(" × ")}`
}

export async function gcdLcm(args: { a?: number; b?: number }): Promise<string> {
  const a = args.a
  const b = args.b
  if (a === undefined || b === undefined || !Number.isInteger(a) || !Number.isInteger(b)) {
    throw new MathError("Provide two integers")
  }
  const g = gcd(a, b)
  const l = Math.abs(a * b) / (g || 1)
  return `GCD(${a}, ${b}) = ${g}\nLCM(${a}, ${b}) = ${l}`
}

export async function stats(args: { values?: string }): Promise<string> {
  const values = (args.values ?? "").split(",").map((v) => Number(v.trim())).filter((v) => Number.isFinite(v))
  if (values.length < 2) throw new MathError("Provide at least two comma separated numbers")
  const n = values.length
  const sum = values.reduce((a, b) => a + b, 0)
  const mean = sum / n
  const sorted = [...values].sort((a, b) => a - b)
  const median = n % 2 ? sorted[(n - 1) / 2] : (sorted[n / 2 - 1] + sorted[n / 2]) / 2
  const freq = new Map<number, number>()
  for (const v of values) freq.set(v, (freq.get(v) ?? 0) + 1)
  let mode = sorted[0]
  let maxCount = 0
  for (const [v, c] of freq) if (c > maxCount) { maxCount = c; mode = v }
  const variance = values.reduce((a, v) => a + (v - mean) ** 2, 0) / n
  const sd = Math.sqrt(variance)
  const fmt = (v: number) => Number.isInteger(v) ? String(v) : v.toFixed(4).replace(/0+$/, "").replace(/\.$/, "")
  return `Count: ${n}\nMean: ${fmt(mean)}\nMedian: ${fmt(median)}\nMode: ${fmt(mode)}\nMin: ${fmt(sorted[0])} | Max: ${fmt(sorted[n - 1])}\nStd dev: ${fmt(sd)}`
}

// ---- muxB tools:

type OaisEntry = {
  number?: number | string;
  name?: string | string[];
  offset?: string;
  data?: string | string[];
  formula?: string | string[];
  keyword?: string | string[];
  comment?: string | string[];
  example?: string;
};

