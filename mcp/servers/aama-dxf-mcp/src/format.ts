import type { FormatModule, Parsed, ParsedRecord } from "./types.js"

function parse(text: string): Parsed {
  const issues: Parsed["issues"] = []
  const records: ParsedRecord[] = []
  const lines = text.split(/\r?\n/)
  const pairs: Array<{ code: number; value: string; line: number }> = []

  for (let index = 0; index + 1 < lines.length; index += 2) {
    const rawCode = lines[index].trim()
    if (rawCode.length === 0 && index + 2 >= lines.length) break
    const code = Number(rawCode)
    if (!Number.isInteger(code)) {
      issues.push({ code: "bad-group-code", severity: "error", message: `Group code must be an integer: ${rawCode}`, line: index + 1 })
      continue
    }
    pairs.push({ code, value: lines[index + 1] ?? "", line: index + 1 })
  }

  let sections = 0
  let ends = 0
  let entity = ""
  const entities = new Map<string, number>()
  const sectionNames = new Set<string>()
  const layers = new Set<string>()
  let inHeader = false
  let hasAcadVer = false

  for (const [index, pair] of pairs.entries()) {
    if (pair.code === 0 && pair.value === "SECTION") {
      sections += 1
      const next = pairs[index + 1]
      if (next && next.code === 2) sectionNames.add(next.value)
      inHeader = next?.value === "HEADER"
      continue
    }
    if (pair.code === 0 && pair.value === "ENDSEC") {
      ends += 1
      continue
    }
    if (pair.code === 0) {
      entity = pair.value
      if (entity === "EOF") break
      entities.set(entity, (entities.get(entity) ?? 0) + 1)
      records.push({ id: `${entity}:${index + 1}`, kind: "entity", fields: { type: entity, line: pair.line } })
      continue
    }
    if (pair.code === 9 && pair.value === "$ACADVER") hasAcadVer = true
    if (pair.code === 8 && pair.value) {
      layers.add(pair.value)
      if (entity) records.push({ id: `layer:${pair.value}:${index + 1}`, kind: "layer", fields: { entity, layer: pair.value, line: pair.line } })
    }
  }

  if (sections === 0) issues.push({ code: "no-section", severity: "error", message: "DXF has no SECTION" })
  if (sections !== ends) issues.push({ code: "unbalanced-sections", severity: "error", message: `${sections} SECTION(s) but ${ends} ENDSEC(s)` })
  if (!sectionNames.has("ENTITIES")) {
    issues.push({ code: "no-entities", severity: "error", message: "DXF has no ENTITIES section" })
  }
  if (!hasAcadVer) issues.push({ code: "no-version", severity: "warning", message: "Header has no $ACADVER" })
  if (!entities.has("POLYLINE") && !entities.has("LWPOLYLINE")) {
    issues.push({ code: "no-outline", severity: "warning", message: "Pattern has no POLYLINE outline" })
  }

  return {
    format: "AAMA DXF",
    records,
    meta: {
      pairs: pairs.length,
      sections,
      entities: [...entities.keys()].filter((name) => name !== "SECTION" && name !== "ENDSEC" && name !== "EOF").length,
      polylines: (entities.get("POLYLINE") ?? 0) + (entities.get("LWPOLYLINE") ?? 0),
      layers: layers.size,
    },
    issues,
  }
}

const reference = [
  "AAMA / ASTM D6673 pattern DXF",
  "",
  "0",
  "SECTION",
  "2",
  "ENTITIES",
  "0",
  "POLYLINE",
  "8",
  "1",
  "...",
  "0",
  "ENDSEC",
  "0",
  "EOF",
  "",
  "DXF is pairs of lines: group code, then value.",
  "SECTION opens a block and ENDSEC closes it.",
  "Piece outlines are POLYLINEs on layer 1, 2, 3...",
  "Text and drill holes use TEXT and CIRCLE entities.",
].join("\n")

export const format: FormatModule = {
  slug: "aama-dxf",
  displayName: "AAMA DXF",
  extensions: [".dxf"],
  description: "Parse AAMA/ASTM pattern DXF, validate sections, entities and outlines.",
  reference,
  parse,
  sample: () =>
    [
      "0", "SECTION", "2", "HEADER", "9", "$ACADVER", "1", "AC1009", "0", "ENDSEC",
      "0", "SECTION", "2", "ENTITIES",
      "0", "POLYLINE", "8", "1",
      "0", "VERTEX", "8", "1", "10", "0.0", "20", "0.0",
      "0", "VERTEX", "8", "1", "10", "10.0", "20", "0.0",
      "0", "SEQEND",
      "0", "ENDSEC",
      "0", "EOF",
    ].join("\n") + "\n",
}
