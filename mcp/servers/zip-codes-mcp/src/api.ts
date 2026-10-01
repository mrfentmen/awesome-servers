const BASE = "https://api.zippopotam.us/us"
const UA = "mrfentmen-zip-codes-mcp/1.0 (https://github.com/mrfentmen)"
export class ZipError extends Error {}

async function get<T>(url: string): Promise<T> {
  const res = await fetch(url, { headers: { "User-Agent": UA, Accept: "application/json" }, signal: AbortSignal.timeout(20000) })
  if (res.status === 429) throw new ZipError("Zippopotam rate limit hit, wait and retry")
  if (!res.ok) throw new ZipError(`Zippopotam error ${res.status}`)
  return (await res.json()) as T
}

export async function zipLookup(args: { zip?: string }): Promise<string> {
  const zip = (args.zip ?? "").trim()
  if (!/^\d{5}$/.test(zip)) throw new ZipError("Provide a five digit US zip code")
  const d = await get<any>(`${BASE}/${zip}`)
  const places = d?.places ?? []
  if (!places.length) return `No data for ${zip}`
  const postCode = d?.["post code"] ?? zip
  return places.map((p: any) => `${postCode} | ${p?.["place name"] ?? "n/a"}, ${p?.["state abbreviation"] ?? ""} ${p?.longitude ?? ""}, ${p?.latitude ?? ""}`).join("\n")
}

export async function cityLookup(args: { city?: string; state?: string }): Promise<string> {
  const city = (args.city ?? "").trim().toLowerCase()
  const state = (args.state ?? "").trim().toLowerCase()
  if (!city || !state) throw new ZipError("Provide a city and two letter state")
  const d = await get<any>(`${BASE}/${encodeURIComponent(city)}/${state}`)
  const places = d?.places ?? []
  if (!places.length) return `No data for ${city}, ${state}`
  const zips = [...new Set(places.map((p: any) => p?.["post code"]).filter(Boolean))]
  return `${city[0].toUpperCase()}${city.slice(1)}, ${state.toUpperCase()}\nZip codes: ${zips.join(", ")}`
}

// ---- muxB tools:

export interface ReverseGeocodeArgs {
  latitude: number;
  longitude: number;
}

// ---- gap4c4 tools:

export async function nearbyPostcodes(args: { latitude: number; longitude: number; radius?: number; limit?: number }): Promise<string> {
  const lat=Number(args.latitude), lon=Number(args.longitude); if (!Number.isFinite(lat)||lat < -90||lat>90||!Number.isFinite(lon)||lon < -180||lon>180) throw new ZipError('Provide valid latitude and longitude.')
  const radius=Math.max(100,Math.min(Math.round(args.radius??5000),10000)), limit=Math.max(1,Math.min(Math.round(args.limit??10),100))
  const res=await fetch(`https://api.postcodes.io/postcodes?lon=${lon}&lat=${lat}&radius=${radius}&limit=${limit}`,{headers:{'User-Agent':UA,Accept:'application/json'},signal:AbortSignal.timeout(20000)})
  if(!res.ok) throw new ZipError(`postcodes.io returned ${res.status}`)
  const d=await res.json() as {result?:{postcode?:string;distance?:number;admin_district?:string;country?:string;latitude?:number;longitude?:number}[]}
  const rows=d.result??[]; if(!rows.length)return `No postcodes reported near ${lat},${lon}.`
  return `Postcodes within ${radius}m of ${lat},${lon}:\n`+rows.slice(0,limit).map((r,i)=>`${i+1}. ${r.postcode??'?'} | ${r.distance!=null?`${Math.round(r.distance)}m`: 'distance not reported'} | ${r.admin_district??'not reported'}, ${r.country??'not reported'} | ${r.latitude??'?'},${r.longitude??'?'}`).join('\n')
}

export async function postcodeAutocomplete(args: { postcode: string; limit?: number }): Promise<string> {
  const postcode=(args.postcode??'').trim(); if(!postcode) throw new ZipError('Provide a postcode prefix.')
  const limit=Math.max(1,Math.min(Math.round(args.limit??10),20))
  const res=await fetch(`https://api.postcodes.io/postcodes/${encodeURIComponent(postcode)}/autocomplete?limit=${limit}`,{headers:{'User-Agent':UA,Accept:'application/json'},signal:AbortSignal.timeout(20000)})
  if(!res.ok) throw new ZipError(`postcodes.io returned ${res.status}`)
  const d=await res.json() as {result?:string[]}; const rows=d.result??[]; if(!rows.length)return `No postcode completions for "${postcode}".`
  return `Postcode completions for "${postcode}":\n`+rows.slice(0,limit).join('\n')
}
