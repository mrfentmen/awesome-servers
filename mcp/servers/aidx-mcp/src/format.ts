import type { FormatModule, Parsed, ParsedRecord } from "./types.js"
import { readRoot, scanTags, validateXml } from "./_xml.js"

const local = (name: string): string => (name.includes(":") ? name.slice(name.lastIndexOf(":") + 1) : name)
const FLIGHTS = new Set(["FlightInformation", "FlightSchedule", "FlightLeg", "FlightSegment", "FlightStatus"])

function parse(text: string): Parsed {
  const issues: Parsed["issues"] = []
  const root = readRoot(text)
  validateXml(text, root, "AIDX message", issues)

  const tags = scanTags(text)
  const records: ParsedRecord[] = []
  let flights = 0
  let legs = 0
  let airports = 0
  const flightNumbers = new Set<string>()

  for (const tag of tags) {
    if (tag.close) continue
    const name = local(tag.name)
    if (!FLIGHTS.has(name)) continue
    flights += 1
    if (name === "FlightLeg") {
      legs += 1
      const number = tag.attrs.FlightNumber ?? ""
      if (number) {
        if (flightNumbers.has(number)) issues.push({ code: "duplicate-flight", severity: "error", message: `Flight ${number} appears twice`, line: tag.line })
        flightNumbers.add(number)
      } else {
        issues.push({ code: "leg-without-number", severity: "warning", message: "FlightLeg has no FlightNumber", line: tag.line })
      }
      if (!tag.attrs.DepartureAirport) issues.push({ code: "no-origin", severity: "error", message: "FlightLeg has no DepartureAirport", line: tag.line })
      if (!tag.attrs.ArrivalAirport) issues.push({ code: "no-destination", severity: "error", message: "FlightLeg has no ArrivalAirport", line: tag.line })
    }
    if (/Airport$/.test(name)) airports += 1
    records.push({ id: `flight:${records.length + 1}`, kind: name, fields: { flightNumber: tag.attrs.FlightNumber ?? "", line: tag.line } })
  }

  if (local(root) !== "AIDX") {
    issues.push({ code: "bad-root", severity: "error", message: `Root must be AIDX, found ${root || "nothing"}` })
  }
  if (flights === 0) issues.push({ code: "no-flights", severity: "error", message: "Message has no flight element" })
  if (legs === 0) issues.push({ code: "no-legs", severity: "warning", message: "Message has no FlightLeg" })

  return {
    format: "AIDX",
    records,
    meta: { flights, legs, airports },
    issues,
  }
}

const reference = [
  "IATA AIDX airline message (XML)",
  "",
  '<AIDX xmlns="http://www.iata.org/IATA/2007/00">',
  "  <FlightInformation>",
  '    <FlightLeg FlightNumber="BA123" DepartureAirport="LHR" ArrivalAirport="JFK"/>',
  "  </FlightInformation>",
  "</AIDX>",
  "",
  "Root is AIDX.",
  "Flights appear in FlightInformation or FlightSchedule.",
  "Each FlightLeg needs departure and arrival airports.",
].join("\n")

export const format: FormatModule = {
  slug: "aidx",
  displayName: "AIDX",
  extensions: [".xml", ".aidx"],
  description: "Parse AIDX messages, validate flights, legs and airports.",
  reference,
  parse,
  sample: () =>
    [
      '<?xml version="1.0"?>',
      '<AIDX xmlns="http://www.iata.org/IATA/2007/00">',
      "  <FlightInformation>",
      '    <FlightLeg FlightNumber="BA123" DepartureAirport="LHR" ArrivalAirport="JFK"/>',
      '    <FlightLeg FlightNumber="BA456" DepartureAirport="JFK" ArrivalAirport="LHR"/>',
      "  </FlightInformation>",
      "</AIDX>",
    ].join("\n") + "\n",
}
