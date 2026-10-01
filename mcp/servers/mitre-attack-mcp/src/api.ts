export class MitreError extends Error {}

// ---- muxC tools:

const ATTACK_UA = "mrfentmen-mitre-attack-mcp/1.0 (https://github.com/mrfentmen)"

const STIX = "https://raw.githubusercontent.com/mitre-attack/attack-stix-data/master/enterprise-attack/enterprise-attack.json"

const bundleCache: { value: any[] | null } = { value: null }

async function objects(): Promise<any[]> {
  if (bundleCache.value) return bundleCache.value
  const res = await fetch(STIX, { headers: { "User-Agent": ATTACK_UA, Accept: "application/json" }, signal: AbortSignal.timeout(60000) })
  if (!res.ok) throw new MitreError(`The MITRE ATT&CK STIX bundle fetch returned ${res.status}`)
  const d = (await res.json()) as { objects?: any[] }
  bundleCache.value = d.objects ?? []
  return bundleCache.value
}

function nameOf(o: any): string {
  return o?.name ?? "unnamed"
}

function idOf(o: any): string {
  return String(o?.external_references?.[0]?.external_id ?? o?.id ?? "?").replace(/^attack-pattern--/, "").replace(/^intrusion-set--/, "").replace(/^malware--/, "")
}

// ---- gap4d1 tools:

