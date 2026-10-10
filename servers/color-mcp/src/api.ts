const BASE = "https://www.thecolorapi.com"
const UA = "mrfentmen-color-mcp/1.0 (https://github.com/mrfentmen)"
export class ColorError extends Error {}

async function get<T>(url: string): Promise<T> {
  const res = await fetch(url, { headers: { "User-Agent": UA, Accept: "application/json" }, signal: AbortSignal.timeout(25000) })
  if (res.status === 429) throw new ColorError("The Color API rate limit hit, wait and retry")
  if (!res.ok) throw new ColorError(`The Color API error ${res.status}`)
  return (await res.json()) as T
}

export async function colorInfo(args: { hex?: string }): Promise<string> {
  const hex = (args.hex ?? "").trim().replace(/^#/, "")
  if (!/^[0-9a-fA-F]{3}$|^[0-9a-fA-F]{6}$/.test(hex)) throw new ColorError("Provide a 3 or 6 digit hex value like ff0000")
  const d = await get<any>(`${BASE}/id?hex=${encodeURIComponent(hex)}`)
  const rgb = d?.rgb?.value ?? "n/a"
  const hsl = d?.hsl?.value ?? "n/a"
  const cmyk = d?.cmyk?.value ?? "n/a"
  return `#${hex.toUpperCase()}\nName: ${d?.name?.value ?? "n/a"} (${d?.name?.closest_named_hex ?? ""})\nRGB: ${rgb}\nHSL: ${hsl}\nCMYK: ${cmyk}\nHSV: ${d?.hsv?.value ?? "n/a"}`
}

export async function colorScheme(args: { hex?: string; mode?: string }): Promise<string> {
  const hex = (args.hex ?? "").trim().replace(/^#/, "")
  if (!/^[0-9a-fA-F]{6}$/.test(hex)) throw new ColorError("Provide a 6 digit hex value")
  const mode = (args.mode ?? "monochrome").toLowerCase()
  const d = await get<any>(`${BASE}/scheme?hex=${encodeURIComponent(hex)}&mode=${encodeURIComponent(mode)}`)
  const colors = d?.colors ?? []
  if (!colors.length) return "No scheme returned"
  return colors.map((c: any, i: number) => `${i + 1}. ${c?.hex?.value ?? ""}  ${c?.name?.value ?? ""}`).join("\n")
}

// ---- muxA tools:

export interface ContrastArgs {
  foreground: string;
  background: string;
}

export interface RandomArgs {
  format?: string;
}

