export const errorMessage = (e: unknown): string => e instanceof Error ? e.message : String(e)

// ---- gap4d4 tools:

async function licenseJson<T>(url: string): Promise<T> {
  const res = await fetch(url, { headers: { 'User-Agent': 'license-boundary-mcp/1.0', Accept: 'application/json' }, signal: AbortSignal.timeout(20000) })
  if (!res.ok) throw new Error(`License source returned HTTP ${res.status}`)
  return await res.json() as T
}

function licenseField(value: unknown): string {
  return value == null ? 'not reported' : String(value).replace(/\s+/g, ' ').slice(0, 500)
}

export async function searchSpdx(args: { query?: string; limit?: number }): Promise<string> {
  const data = await licenseJson<{ licenseListVersion?: string; licenses: Array<{ licenseId?: string; name?: string; isDeprecatedLicenseId?: boolean; isOsiApproved?: boolean }> }>('https://spdx.org/licenses/licenses.json')
  const query = (args.query ?? '').toLowerCase()
  const rows = data.licenses.filter(r => `${r.licenseId} ${r.name}`.toLowerCase().includes(query)).slice(0, Math.max(1, Math.min(Math.floor(args.limit ?? 10), 30)))
  return `SPDX list ${licenseField(data.licenseListVersion)}; ${rows.length} matches shown:\n` + rows.map(r => `${licenseField(r.licenseId)} | ${licenseField(r.name)} | OSI approved: ${licenseField(r.isOsiApproved)} | deprecated: ${licenseField(r.isDeprecatedLicenseId)}`).join('\n')
}

export async function spdxLicense(args: { id: string }): Promise<string> {
  const d = await licenseJson<{ licenseId?: string; name?: string; isOsiApproved?: boolean; isFsfLibre?: boolean; isDeprecatedLicenseId?: boolean; licenseText?: string }>(`https://spdx.org/licenses/${encodeURIComponent(args.id)}.json`)
  if (!d.licenseId) throw new Error('The source did not report a license ID.')
  return `${licenseField(d.licenseId)} | ${licenseField(d.name)}\nOSI approved: ${licenseField(d.isOsiApproved)}; FSF libre: ${licenseField(d.isFsfLibre)}; deprecated: ${licenseField(d.isDeprecatedLicenseId)}\nPublic reference text (up to 6000 characters):\n${d.licenseText?.slice(0, 6000) ?? 'not reported'}`
}

export async function spdxException(args: { id: string }): Promise<string> {
  const d = await licenseJson<{ licenseExceptionId?: string; name?: string; licenseComments?: string; licenseExceptionText?: string }>(`https://spdx.org/licenses/${encodeURIComponent(args.id)}.json`)
  if (!d.licenseExceptionId) throw new Error('The source did not report an exception ID.')
  return `${licenseField(d.licenseExceptionId)} | ${licenseField(d.name)}\n${licenseField(d.licenseComments)}\nPublic exception text (up to 6000 characters):\n${d.licenseExceptionText?.slice(0, 6000) ?? 'not reported'}`
}

