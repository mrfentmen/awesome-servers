/**
 * NHTSA (US National Highway Traffic Safety Administration).
 * Two keyless services: vpic.nhtsa.dot.gov for VIN decoding and
 * api.nhtsa.gov for recalls, complaints and the make/model catalogue.
 */
const VPIC = "https://vpic.nhtsa.dot.gov/api/vehicles"
const SAFETY = "https://api.nhtsa.gov"

export class NhtsaError extends Error {}

async function getJson(url: string, timeoutMs = 30000): Promise<any> {
  const ctrl = new AbortController()
  const timer = setTimeout(() => ctrl.abort(), timeoutMs)
  try {
    const res = await fetch(url, {
      signal: ctrl.signal,
      headers: { "user-agent": "nhtsa-mcp", accept: "application/json" },
    })
    if (res.status === 404) throw new NhtsaError("NHTSA has no record for that request")
    if (!res.ok) throw new NhtsaError(`NHTSA responded ${res.status}`)
    return await res.json()
  } catch (e) {
    if (e instanceof NhtsaError) throw e
    if ((e as Error).name === "AbortError") throw new NhtsaError("NHTSA request timed out")
    if (e instanceof SyntaxError) throw new NhtsaError("NHTSA returned malformed JSON")
    throw new NhtsaError(`NHTSA request failed: ${(e as Error).message}`)
  } finally {
    clearTimeout(timer)
  }
}

const vin = (v: string): string => {
  const clean = v.trim().toUpperCase()
  // I, O and Q never appear in a VIN; * is allowed as a wildcard for unknown spots.
  if (!/^[A-HJ-NPR-Z0-9*]{17}$/.test(clean)) {
    throw new NhtsaError(`A VIN must be 17 characters from A-Z and 0-9 (no I, O or Q); "${v.trim()}" is not`)
  }
  return clean
}

const nonEmpty = (s: unknown): string => {
  const v = String(s ?? "").trim()
  return v && v !== "0" ? v : ""
}

export async function decodeVin(input: string): Promise<string> {
  const v = vin(input)
  const d = await getJson(`${VPIC}/DecodeVinValues/${v}?format=json`)
  const r = (d?.Results ?? [])[0]
  if (!r) throw new NhtsaError(`NHTSA could not decode ${v}`)
  const errors = nonEmpty(r.ErrorText)
  const fields: [string, string][] = [
    ["Make", nonEmpty(r.Make)],
    ["Model", nonEmpty(r.Model)],
    ["Model year", nonEmpty(r.ModelYear)],
    ["Trim", nonEmpty(r.Trim)],
    ["Series", nonEmpty(r.Series)],
    ["Body class", nonEmpty(r.BodyClass)],
    ["Vehicle type", nonEmpty(r.VehicleType)],
    ["Drive type", nonEmpty(r.DriveType)],
    ["Engine cylinders", nonEmpty(r.EngineCylinders)],
    ["Displacement (L)", nonEmpty(r.DisplacementL)],
    ["Fuel", nonEmpty(r.FuelTypePrimary)],
    ["Plant country", nonEmpty(r.PlantCountry)],
    ["Manufacturer", nonEmpty(r.Manufacturer)],
    ["GVWR", nonEmpty(r.GVWR)],
  ]
  return [
    `VIN ${v}`,
    "",
    ...fields.filter(([, val]) => val).map(([k, val]) => `  ${k}: ${val}`),
    errors ? `\nDecoder notes: ${errors.slice(0, 300)}` : "",
    `\nSource: NHTSA vPIC. Not every field is present for every vehicle.`,
  ]
    .filter(Boolean)
    .join("\n")
}

export async function recalls(make: string, model: string, year: number): Promise<string> {
  const d = await getJson(
    `${SAFETY}/recalls/recallsByVehicle?make=${encodeURIComponent(make)}&model=${encodeURIComponent(model)}&modelYear=${year}`
  )
  const rows: any[] = d?.results ?? []
  if (rows.length === 0) return `No NHTSA recalls on record for ${year} ${make} ${model}.`
  const parked = rows.filter((r) => String(r.parkIt) === "1").length
  return [
    `NHTSA recalls for ${year} ${make} ${model} (${rows.length}${parked ? `, ${parked} with do-not-drive advice` : ""}):`,
    "",
    ...rows.slice(0, 12).map((r, i) => {
      const parts = [
        `${i + 1}. ${r.NHTSACampaignNumber ?? "campaign ?"} — ${String(r.Component ?? "component unknown")}`,
        `   Reported ${String(r.ReportReceivedDate ?? "").slice(0, 10)} · ${r.Manufacturer ?? ""}`,
        `   ${String(r.Summary ?? "").replace(/\s+/g, " ").slice(0, 260)}`,
        r.Consequence ? `   Risk: ${String(r.Consequence).replace(/\s+/g, " ").slice(0, 200)}` : "",
        r.Remedy ? `   Fix: ${String(r.Remedy).replace(/\s+/g, " ").slice(0, 200)}` : "",
        r.overTheAirUpdate === "1" ? "   This recall can be done over the air." : "",
      ]
      return parts.filter(Boolean).join("\n")
    }),
  ].join("\n")
}

export async function complaints(make: string, model: string, year: number): Promise<string> {
  const d = await getJson(
    `${SAFETY}/complaints/complaintsByVehicle?make=${encodeURIComponent(make)}&model=${encodeURIComponent(model)}&modelYear=${year}`
  )
  const rows: any[] = d?.results ?? []
  if (rows.length === 0) return `No owner complaints on record for ${year} ${make} ${model}.`
  const crashes = rows.filter((r) => Number(r.crash) === 1).length
  const fires = rows.filter((r) => Number(r.fire) === 1).length
  const injuries = rows.filter((r) => Number(r.numberOfInjuries ?? 0) > 0).length
  return [
    `NHTSA owner complaints for ${year} ${make} ${model}: ${rows.length} total · ${crashes} crashes · ${fires} fires · ${injuries} with injuries`,
    "",
    ...rows.slice(0, 10).map((r, i) => {
      const comps = Array.isArray(r.components) ? r.components.map((c: any) => c.name).join(", ") : r.components
      const when = r.dateOfIncident || r.dateComplaintFiled || "date not given"
      return `${i + 1}. ${when} — ${String(comps ?? "component unknown")}${r.odiNumber ? ` (ODI ${r.odiNumber})` : ""}\n   ${String(r.summary ?? "").replace(/\s+/g, " ").slice(0, 260)}`
    }),
  ].join("\n")
}

export async function listMakes(year: number): Promise<string> {
  const d = await getJson(`${SAFETY}/products/vehicle/makes?modelYear=${year}&issueType=r`)
  const rows: any[] = d?.results ?? d?.Results ?? []
  const names = rows.map((r) => r.make ?? r.Make).filter(Boolean)
  if (names.length === 0) return `No makes listed for ${year}.`
  return [`Vehicle makes with recalls in ${year} (${names.length}):`, "", names.join(", ")].join("\n")
}

export async function listModels(make: string, year: number): Promise<string> {
  const d = await getJson(`${SAFETY}/products/vehicle/models?make=${encodeURIComponent(make)}&modelYear=${year}&issueType=r`)
  const rows: any[] = d?.results ?? d?.Results ?? []
  const names = [...new Set(rows.map((r) => r.model ?? r.Model).filter(Boolean))]
  if (names.length === 0) return `No models listed for ${make} ${year}.`
  return [`Models with recalls for ${make} ${year} (${names.length}):`, "", names.sort().join(", ")].join("\n")
}
