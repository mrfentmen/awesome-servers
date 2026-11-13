import type { FormatModule, Parsed, ParsedRecord } from "./types.js"
import { readRoot, scanTags, validateXml } from "./_xml.js"

const local = (name: string): string => (name.includes(":") ? name.slice(name.lastIndexOf(":") + 1) : name)
const FEATURES = /^(AirportHeliport|Runway|Taxiway|Navaid|DesignatedPoint|Airspace|RouteSegment|Obstacle|AircraftStand|Apron|Helipad)$/

function parse(text: string): Parsed {
  const issues: Parsed["issues"] = []
  const root = readRoot(text)
  validateXml(text, root, "AIXM message", issues)

  const tags = scanTags(text)
  const records: ParsedRecord[] = []
  const ids = new Set<string>()
  let features = 0
  let designators = 0

  for (const tag of tags) {
    if (tag.close) continue
    const name = local(tag.name)
    if (!FEATURES.test(name)) {
      if (name === "designator") designators += 1
      continue
    }
    features += 1
    const gmlId = tag.attrs["gml:id"] ?? tag.attrs.id ?? ""
    if (!gmlId) {
      issues.push({ code: "feature-without-id", severity: "error", message: `${name} has no gml:id`, line: tag.line })
    } else if (ids.has(gmlId)) {
      issues.push({ code: "duplicate-feature", severity: "error", message: `Feature id ${gmlId} appears twice`, line: tag.line })
    }
    ids.add(gmlId)
    records.push({ id: `feature:${gmlId || features}`, kind: "feature", fields: { type: name, id: gmlId, line: tag.line } })
  }

  if (!/AIXM/i.test(local(root))) {
    issues.push({ code: "bad-root", severity: "error", message: `Root must be an AIXM element, found ${root || "nothing"}` })
  }
  if (features === 0) issues.push({ code: "no-features", severity: "error", message: "Message has no AIXM feature" })
  if (designators === 0) issues.push({ code: "no-designators", severity: "warning", message: "No designator found on any feature" })

  return {
    format: "AIXM",
    records,
    meta: { root: local(root), features, designators, idCount: ids.size },
    issues,
  }
}

const reference = [
  "AIXM 5 aeronautical data (XML)",
  "",
  "<AIXM-Snapshot xmlns:aixm=\"http://www.aixm.aero/schema/5.1\">",
  "  <aixm:AirportHeliport gml:id=\"AH1\">",
  "    <aixm:designator>EGLL</aixm:designator>",
  "  </aixm:AirportHeliport>",
  "</AIXM-Snapshot>",
  "",
  "The root contains AIXM; features are AirportHeliport, Runway, Airspace and so on.",
  "Every feature needs a unique gml:id.",
  "Features normally carry a designator.",
].join("\n")

export const format: FormatModule = {
  slug: "aixm",
  displayName: "AIXM",
  extensions: [".xml"],
  description: "Parse AIXM messages, validate features, ids and designators.",
  reference,
  parse,
  sample: () =>
    [
      '<?xml version="1.0"?>',
      '<AIXM-Snapshot xmlns:aixm="http://www.aixm.aero/schema/5.1" xmlns:gml="http://www.opengis.net/gml/3.2">',
      '  <aixm:AirportHeliport gml:id="AH1">',
      "    <aixm:designator>EGLL</aixm:designator>",
      "  </aixm:AirportHeliport>",
      "  <aixm:Runway gml:id=\"RW1\">",
      "    <aixm:designator>09L/27R</aixm:designator>",
      "  </aixm:Runway>",
      "</AIXM-Snapshot>",
    ].join("\n") + "\n",
}
