import type { FormatModule, Parsed, ParsedRecord } from "./types.js"
import { scanTags, validateXml } from "./_xml.js"

const INTERESTING = new Set(["Campus", "Building", "Space", "Surface", "Window", "Zone", "Schedule"])

function parse(text: string): Parsed {
  const issues: Parsed["issues"] = []
  validateXml(text, "gbXML", "gbXML", issues)

  const tags = scanTags(text)
  const records: ParsedRecord[] = []
  const root = tags.find((tag) => tag.name === "gbXML")

  for (const tag of tags) {
    if (!INTERESTING.has(tag.name) || tag.close) continue
    const area = tag.attrs.area ?? null
    if (area !== null && !Number.isFinite(Number(area))) {
      issues.push({ code: "bad-area", severity: "error", message: `${tag.name} area is not a number: ${area}`, line: tag.line })
    }
    records.push({
      id: tag.attrs.id ?? `${tag.name}:${records.length + 1}`,
      kind: tag.name,
      fields: {
        name: tag.attrs.name ?? "",
        area: area === null ? null : Number(area),
        volume: tag.attrs.volume ? Number(tag.attrs.volume) : null,
        line: tag.line,
      },
    })
  }

  const buildings = records.filter((record) => record.kind === "Building").length
  if (buildings === 0) {
    issues.push({ code: "no-building", severity: "error", message: "gbXML needs at least one Building element" })
  }
  if (root && !root.attrs.version) {
    issues.push({ code: "no-version", severity: "warning", message: "gbXML root has no version attribute", line: root.line })
  }

  return {
    format: "gbXML",
    records,
    meta: {
      version: root?.attrs.version ?? "",
      buildings,
      spaces: records.filter((record) => record.kind === "Space").length,
      surfaces: records.filter((record) => record.kind === "Surface").length,
      totalArea: Math.round(records.reduce((sum, record) => sum + (typeof record.fields.area === "number" ? record.fields.area : 0), 0) * 100) / 100,
    },
    issues,
  }
}

const reference = [
  "gbXML building energy exchange",
  "",
  "<gbXML version=\"0.37\"> root, then Campus > Building > Space > Surface > Window.",
  "Space carries area and volume; Surface carries area and tilt.",
  "id attributes must be unique because surfaces reference them.",
  "Most tools expect a version attribute on the root.",
].join("\n")

export const format: FormatModule = {
  slug: "gbxml",
  displayName: "gbXML",
  extensions: [".xml", ".gbxml"],
  description: "Parse gbXML buildings, spaces and surfaces, validate structure and areas.",
  reference,
  parse,
  sample: () =>
    [
      '<?xml version="1.0"?>',
      '<gbXML version="0.37" xmlns="http://www.gbxml.org/schema">',
      '  <Campus id="c1">',
      '    <Building id="b1" name="Office">',
      '      <Space id="s1" name="Lobby" area="25.5" volume="76.5"/>',
      '      <Surface id="su1" area="12.0"/>',
      "    </Building>",
      "  </Campus>",
      "</gbXML>",
    ].join("\n") + "\n",
}
