export class SemverError extends Error {}

interface Parts { major: number; minor: number; patch: number; pre: string[] }

function parse(v: string): Parts {
  const s = (v ?? "").trim()
  const m = /^v?(\d+)\.(\d+)\.(\d+)(?:-([0-9A-Za-z.-]+))?/.exec(s)
  if (!m) throw new SemverError(`Invalid version ${v}`)
  return { major: Number(m[1]), minor: Number(m[2]), patch: Number(m[3]), pre: m[4] ? m[4].split(".") : [] }
}

function cmpPre(a: string[], b: string[]): number {
  const n = Math.max(a.length, b.length)
  for (let i = 0; i < n; i++) {
    const x = a[i]
    const y = b[i]
    if (x === undefined) return -1
    if (y === undefined) return 1
    if (x === y) continue
    const xn = /^\d+$/.test(x)
    const yn = /^\d+$/.test(y)
    if (xn && yn) return Number(x) - Number(y)
    if (xn) return -1
    if (yn) return 1
    return x < y ? -1 : 1
  }
  return 0
}

export function compareVersions(a: string, b: string): number {
  const pa = parse(a)
  const pb = parse(b)
  if (pa.major !== pb.major) return pa.major - pb.major
  if (pa.minor !== pb.minor) return pa.minor - pb.minor
  if (pa.patch !== pb.patch) return pa.patch - pb.patch
  if (pa.pre.length === 0 && pb.pre.length === 0) return 0
  if (pa.pre.length === 0) return 1
  if (pb.pre.length === 0) return -1
  return cmpPre(pa.pre, pb.pre)
}

export async function compare(args: { a?: string; b?: string }): Promise<string> {
  const c = compareVersions(args.a ?? "", args.b ?? "")
  const rel = c === 0 ? "equal to" : c < 0 ? "less than" : "greater than"
  return `${args.a} is ${rel} ${args.b}`
}

export async function sortVersions(args: { versions?: string }): Promise<string> {
  const list = (args.versions ?? "").split(",").map((v) => v.trim()).filter(Boolean)
  if (list.length === 0) throw new SemverError("Provide a comma separated list of versions")
  const sorted = [...list].sort(compareVersions)
  return sorted.join("\n")
}

export async function describe(args: { version?: string }): Promise<string> {
  const p = parse(args.version ?? "")
  return `${args.version}\nMajor: ${p.major}\nMinor: ${p.minor}\nPatch: ${p.patch}\nPrerelease: ${p.pre.join(".") || "none"}`
}

// ---- muxB tools:

interface VersionDoc {
  name?: string
  version?: string
  description?: string
  license?: string
  engines?: Record<string, string>
  deprecated?: string
  dist?: { tarball?: string; unpackedSize?: number; fileCount?: number }
  maintainers?: Array<{ name?: string }>
}

