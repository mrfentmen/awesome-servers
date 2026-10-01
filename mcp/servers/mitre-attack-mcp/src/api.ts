import { readFile, writeFile, mkdir } from "node:fs/promises"
import { tmpdir } from "node:os"
import { join } from "node:path"

const UA = "mrfentmen-mitre-attack-mcp/1.0 (https://github.com/mrfentmen)"
const STIX_URL = "https://raw.githubusercontent.com/mitre-attack/attack-stix-data/master/enterprise-attack/enterprise-attack.json"
const CACHE_PATH = join(tmpdir(), "mitre-attack-bundle.json")
const CACHE_TTL_MS = 6 * 60 * 60 * 1000 // refresh every 6 hours

export class MitreError extends Error {}

interface Technique {
  id: string
  name: string
  description: string
  tactics: string[]
  platforms: string[]
}

async function loadBundle(): Promise<Technique[]> {
  try {
    const stat = await import("node:fs/promises").then((m) => m.stat(CACHE_PATH))
    const age = Date.now() - stat.mtimeMs
    if (age < CACHE_TTL_MS) {
      const cached = JSON.parse(await readFile(CACHE_PATH, "utf-8")) as Technique[]
      if (cached.length > 0) return cached
    }
  } catch {
    // cache miss, fetch below
  }
  const res = await fetch(STIX_URL, { headers: { "User-Agent": UA }, signal: AbortSignal.timeout(60000) })
  if (!res.ok) throw new MitreError(`MITRE data fetch failed with HTTP ${res.status}`)
  const bundle = (await res.json()) as { objects: any[] }
  const techniques: Technique[] = []
  for (const obj of bundle.objects ?? []) {
    if (obj.type !== "attack-pattern") continue
    if (obj.revoked || obj.deprecated) continue
    const tactics: string[] = []
    for (const phase of obj.kill_chain_phases ?? []) {
      if (phase.kill_chain_name === "mitre-attack") tactics.push(phase.phase_name)
    }
    techniques.push({
      id: obj.external_references?.find((r: any) => r.source_name === "mitre-attack")?.external_id ?? obj.id,
      name: obj.name ?? "",
      description: (obj.description ?? "").replace(/\s+/g, " ").trim().slice(0, 600),
      tactics,
      platforms: obj.x_mitre_platforms ?? [],
    })
  }
  try {
    await mkdir(tmpdir(), { recursive: true })
    await writeFile(CACHE_PATH, JSON.stringify(techniques), "utf-8")
  } catch {
    // cache write is best effort
  }
  return techniques
}

export async function search(args: { query?: string; limit?: number }): Promise<string> {
  const q = (args.query ?? "").trim().toLowerCase()
  if (!q) throw new MitreError("Provide a search keyword")
  const limit = Math.min(args.limit ?? 10, 25)
  const all = await loadBundle()
  const hits = all
    .filter((t) => t.name.toLowerCase().includes(q) || t.description.toLowerCase().includes(q) || t.id.toLowerCase().includes(q))
    .slice(0, limit)
  if (!hits.length) return `No techniques match "${args.query}"`
  return hits.map((t, i) => `${i + 1}. ${t.id} | ${t.name} | Tactics: ${t.tactics.join(", ") || "n/a"}`).join("\n")
}

export async function technique(args: { id?: string }): Promise<string> {
  const id = (args.id ?? "").trim().toUpperCase()
  if (!id) throw new MitreError("Provide a technique ID like T1059")
  const all = await loadBundle()
  const t = all.find((x) => x.id === id)
  if (!t) throw new MitreError(`Technique ${id} not found`)
  return [
    `${t.id} | ${t.name}`,
    `Tactics: ${t.tactics.join(", ") || "n/a"}`,
    `Platforms: ${t.platforms.join(", ") || "n/a"}`,
    "",
    t.description,
  ].join("\n")
}

// ---- muxC tools:

const ATTACK_UA = "mrfentmen-mitre-attack-mcp/1.0 (https://github.com/mrfentmen)"

const STIX = "https://raw.githubusercontent.com/mitre-attack/attack-stix-data/master/enterprise-attack/enterprise-attack.json"

let cached: any[] | null = null

async function objects(): Promise<any[]> {
  if (cached) return cached
  const res = await fetch(STIX, { headers: { "User-Agent": ATTACK_UA, Accept: "application/json" }, signal: AbortSignal.timeout(60000) })
  if (!res.ok) throw new MitreError(`The MITRE ATT&CK STIX bundle fetch returned ${res.status}`)
  const d = (await res.json()) as { objects?: any[] }
  cached = d.objects ?? []
  return cached
}

function nameOf(o: any): string {
  return o?.name ?? "unnamed"
}

function idOf(o: any): string {
  return String(o?.external_references?.[0]?.external_id ?? o?.id ?? "?").replace(/^attack-pattern--/, "").replace(/^intrusion-set--/, "").replace(/^malware--/, "")
}

/** The intrusion sets and groups ATT&CK tracks, which a technique search never returns. */
export async function groupList(args: { query?: string; limit?: number }): Promise<string> {
  const all = await objects()
  const rows = all.filter((o) => o.type === "intrusion-set")
  const q = (args.query ?? "").trim().toLowerCase()
  const matched = q ? rows.filter((o) => `${nameOf(o)} ${(o.aliases ?? []).join(" ")}`.toLowerCase().includes(q)) : rows
  const limit = Math.max(1, Math.min(args.limit ?? 10, 50))
  if (!matched.length) return `MITRE ATT&CK has no intrusion set matching "${q}" (it tracks ${rows.length} groups).`
  return `MITRE ATT&CK intrusion sets${q ? ` matching "${q}"` : ""} (${matched.length} of ${rows.length}, ${limit} shown):\n` +
    matched.slice(0, limit).map((o, i) => `${i + 1}. ${nameOf(o)} (${idOf(o)})${(o.aliases ?? []).length ? ` also known as ${(o.aliases ?? []).join(", ")}` : ""}\n   ${String(o.description ?? "").replace(/\s+/g, " ").slice(0, 180)}\n   modified ${String(o.modified ?? "").slice(0, 10)} | https://attack.mitre.org/groups/${idOf(o)}/`).join("\n")
}

/** The malware and tooling entries in the STIX bundle, again outside technique search. */
export async function softwareList(args: { query?: string; limit?: number }): Promise<string> {
  const all = await objects()
  const rows = all.filter((o) => o.type === "malware")
  const q = (args.query ?? "").trim().toLowerCase()
  const matched = q ? rows.filter((o) => `${nameOf(o)} ${(o.aliases ?? []).join(" ")} ${o.description ?? ""}`.toLowerCase().includes(q)) : rows
  const limit = Math.max(1, Math.min(args.limit ?? 10, 50))
  if (!matched.length) return `MITRE ATT&CK has no malware entry matching "${q}" (it lists ${rows.length}).`
  return `MITRE ATT&CK software entries${q ? ` matching "${q}"` : ""} (${matched.length} of ${rows.length}, ${limit} shown):\n` +
    matched.slice(0, limit).map((o, i) => `${i + 1}. ${nameOf(o)} (${idOf(o)}) | ${(o.labels ?? []).join(", ") || "type not reported"}\n   ${(o.aliases ?? []).length ? `also ${(o.aliases ?? []).join(", ")} | ` : ""}platforms ${(o.x_mitre_platforms ?? []).join(", ") || "not reported"}\n   https://attack.mitre.org/software/${idOf(o)}/`).join("\n")
}

/** ATT&CK's own tactic list, straight from the tactic objects in the bundle. */
export async function tacticList(): Promise<string> {
  const all = await objects()
  const rows = all.filter((o) => o.type === "x-mitre-tactic").sort((a, b) => String(a.x_mitre_shortname ?? "").localeCompare(String(b.x_mitre_shortname ?? "")))
  if (!rows.length) return "The ATT&CK STIX bundle carried no tactic objects."
  return `MITRE ATT&CK tactics (${rows.length}):\n` +
    rows.map((o, i) => `${i + 1}. ${nameOf(o)} (${o.x_mitre_shortname ?? "?"})\n   ${String(o.description ?? "").replace(/\s+/g, " ").slice(0, 140)}\n   https://attack.mitre.org/tactics/${o.x_mitre_shortname ?? ""}/`).join("\n")
}
