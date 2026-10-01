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

