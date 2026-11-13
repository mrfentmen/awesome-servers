import type { FormatModule, Parsed, ParsedRecord } from "./types.js"
import { scanTags, validateXml } from "./_xml.js"

const INTERESTING = new Set(["Parcel", "Alignment", "CgPoint", "Surface", "PlanFeature", "Pipe", "Point"])

function parse(text: string): Parsed {
  const issues: Parsed["issues"] = []
  validateXml(text, "LandXML", "LandXML", issues)

  const tags = scanTags(text)
  const records: ParsedRecord[] = []
  const units = tags.find((tag) => tag.name === "Units")
  const root = tags.find((tag) => tag.name === "LandXML")

  for (const tag of tags) {
    if (!INTERESTING.has(tag.name) || tag.close) continue
    const name = tag.attrs.name ?? tag.attrs.desc ?? ""
    const id = `${tag.name}:${records.filter((record) => record.kind === tag.name).length + 1}`
    records.push({
      id,
      kind: tag.name,
      fields: {
        name,
        area: tag.attrs.area ? Number(tag.attrs.area) : null,
        length: tag.attrs.length ? Number(tag.attrs.length) : null,
        line: tag.line,
      },
    })
    if (tag.attrs.area && !Number.isFinite(Number(tag.attrs.area))) {
      issues.push({ code: "bad-area", severity: "error", message: `${tag.name} area is not a number: ${tag.attrs.area}`, line: tag.line })
    }
  }

  if (!units) issues.push({ code: "missing-units", severity: "warning", message: "No Units element; measurements have no declared unit" })

  return {
    format: "LandXML",
    records,
    meta: {
      version: root?.attrs.version ?? "",
      elements: tags.filter((tag) => !tag.close).length,
      parcels: records.filter((record) => record.kind === "Parcel").length,
      alignments: records.filter((record) => record.kind === "Alignment").length,
      linearUnit: units?.attrs.linearUnit ?? "",
      areaUnit: units?.attrs.areaUnit ?? "",
    },
    issues,
  }
}

const reference = [
  "LandXML civil design exchange",
  "",
  "<?xml version=\"1.0\"?> then a <LandXML version=\"1.2\"> root.",
  "Common elements: Units, Parcels/Parcel, Alignments/Alignment, CgPoints/CgPoint,",
  "Surfaces/Surface, PlanFeatures/PlanFeature, Pipes/Pipe.",
  "Parcel and Surface carry area, Alignment carries length.",
  "Units declares linearUnit and areaUnit; without it numbers are ambiguous.",
].join("\n")

export const format: FormatModule = {
  slug: "landxml",
  displayName: "LandXML",
  extensions: [".xml", ".landxml"],
  description: "Parse LandXML parcels, alignments and surfaces, validate structure.",
  reference,
  parse,
  sample: () =>
    [
      '<?xml version="1.0"?>',
      '<LandXML version="1.2" xmlns="http://www.landxml.org/schema/LandXML-1.2">',
      '  <Units><Metric linearUnit="meter" areaUnit="squareMeter"/></Units>',
      '  <Parcels><Parcel name="Lot 1" area="500.0" desc="corner"/></Parcels>',
      '  <Alignments><Alignment name="Main St" length="1250.5"/></Alignments>',
      "</LandXML>",
    ].join("\n") + "\n",
}
