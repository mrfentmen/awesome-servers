const URL = "https://www.cisa.gov/sites/default/files/feeds/known_exploited_vulnerabilities.json"
export class KevError extends Error {}
type Vuln = { cveID?: string; vendorProject?: string; product?: string; vulnerabilityName?: string; shortDescription?: string; dateAdded?: string; dueDate?: string; knownRansomwareCampaignUse?: string; notes?: string; cwes?: string[] }
let cache: { vulnerabilities?: Vuln[]; catalogVersion?: string; dateReleased?: string } | null = null
async function all() { if (cache) return cache; const r = await fetch(URL, { headers: { "User-Agent": "mrfentmen-cisa-kev-mcp/1.0" }, signal: AbortSignal.timeout(20000) }); if (!r.ok) throw new KevError(`CISA KEV error ${r.status}`); cache = await r.json(); return cache! }
export async function search(query: string) { const q = query.toLowerCase(); return (await all()).vulnerabilities?.filter((x) => `${x.cveID} ${x.vendorProject} ${x.product} ${x.vulnerabilityName} ${x.shortDescription}`.toLowerCase().includes(q)).slice(0, 30) ?? [] }
export async function recent(limit: number) { return (await all()).vulnerabilities?.slice(-limit).reverse() ?? [] }
export async function info() { const x = await all(); return { catalogVersion: x.catalogVersion, dateReleased: x.dateReleased, count: x.vulnerabilities?.length ?? 0 } }
export function format(x: unknown) { return JSON.stringify(x, null, 2).slice(0, 14000) }
