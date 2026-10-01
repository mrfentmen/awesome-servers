const BASE = "https://api.macvendors.com"
const UA = "mrfentmen-mac-lookup-mcp/1.0 (https://github.com/mrfentmen)"
export class MacError extends Error {}

export async function vendorLookup(args: { mac?: string }): Promise<string> {
  const mac = (args.mac ?? "").trim().toUpperCase()
  if (!mac) throw new MacError("Provide a MAC address like 3c:07:54:11:22:33")
  const res = await fetch(`${BASE}/${encodeURIComponent(mac)}`, { headers: { "User-Agent": UA, Accept: "text/plain" }, signal: AbortSignal.timeout(20000) })
  if (res.status === 429) throw new MacError("MAC Vendors rate limit hit, wait and retry")
  if (res.status === 404) return `No vendor found for ${mac}`
  if (!res.ok) throw new MacError(`MAC Vendors error ${res.status}`)
  const vendor = (await res.text()).trim()
  return `${mac} is assigned to ${vendor}`
}

// ---- muxC tools:

