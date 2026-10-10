const UA = "mrfentmen-name-age-mcp/1.0 (https://github.com/mrfentmen)"
export class NameError extends Error {}

async function get<T>(url: string): Promise<T> {
  const res = await fetch(url, { headers: { "User-Agent": UA, Accept: "application/json" }, signal: AbortSignal.timeout(20000) })
  if (res.status === 429) throw new NameError("Name API rate limit hit, wait and retry")
  if (!res.ok) throw new NameError(`Name API error ${res.status}`)
  return (await res.json()) as T
}

export async function estimateAge(args: { name?: string }): Promise<string> {
  const name = (args.name ?? "").trim()
  if (!name) throw new NameError("Provide a first name")
  const d = await get<any>(`https://api.agify.io/?name=${encodeURIComponent(name)}`)
  if (d?.age === null || d?.age === undefined) return `No age estimate for "${name}"`
  return `"${d.name}" is typically about ${d.age} years old (based on ${d.count?.toLocaleString() ?? "?"} people in the dataset)`
}

export async function estimateGender(args: { name?: string }): Promise<string> {
  const name = (args.name ?? "").trim()
  if (!name) throw new NameError("Provide a first name")
  const d = await get<any>(`https://api.genderize.io/?name=${encodeURIComponent(name)}`)
  if (!d?.gender) return `No gender estimate for "${name}"`
  const pct = Math.round((d.probability ?? 0) * 100)
  return `"${d.name}" is estimated ${d.gender} with ${pct}% probability (based on ${d.count?.toLocaleString() ?? "?"} people)`
}

// ---- muxB tools:

// Wikidata stores dates as a signed year plus a precision, so only claim a
// birth or death year when the value is precise enough to trust

export interface FamousNamesakesArgs {
  name?: string
  limit?: number
}

export interface NamesakeLifespanArgs {
  name?: string
}

