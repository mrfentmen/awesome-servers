const URL = "https://spdx.org/licenses/licenses.json"
export class SpdxError extends Error {}
type License = { licenseId?: string; name?: string; reference?: string; detailsUrl?: string; isOsiApproved?: boolean; isFsfLibre?: boolean; isDeprecatedLicenseId?: boolean; seeAlso?: string[] }
let cache: License[] | null = null
export async function licenses(): Promise<License[]> { if (cache) return cache; const r = await fetch(URL, { signal: AbortSignal.timeout(20000) }); if (!r.ok) throw new SpdxError(`SPDX error ${r.status}`); const data = await r.json() as { licenses?: License[] }; cache = data.licenses ?? []; return cache }
export async function find(query: string) { const q = query.toLowerCase(); return (await licenses()).filter((x) => `${x.licenseId} ${x.name}`.toLowerCase().includes(q)).slice(0, 20) }
export async function get(id: string) { return (await licenses()).find((x) => x.licenseId?.toLowerCase() === id.toLowerCase()) ?? null }
export function format(rows: License[]) { return JSON.stringify(rows, null, 2).slice(0, 10000) }
