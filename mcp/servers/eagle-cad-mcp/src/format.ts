import type { FormatModule, Parsed, ParsedRecord } from "./types.js"
import { scanTags, validateXml } from "./_xml.js"

function parse(text: string): Parsed {
  const issues: Parsed["issues"] = []
  validateXml(text, "eagle", "EAGLE file", issues)

  const tags = scanTags(text)
  const records: ParsedRecord[] = []
  const parts = new Set<string>()
  const nets = new Set<string>()
  let sheets = 0

  for (const tag of tags) {
    if (tag.close) continue
    if (tag.name === "part") {
      const name = tag.attrs.name ?? ""
      const library = tag.attrs.library ?? ""
      const deviceset = tag.attrs.deviceset ?? ""
      if (!name) {
        issues.push({ code: "part-without-name", severity: "error", message: "part has no name", line: tag.line })
      } else if (parts.has(name)) {
        issues.push({ code: "duplicate-part", severity: "error", message: `Part ${name} appears twice`, line: tag.line })
      }
      parts.add(name)
      if (!library || !deviceset) {
        issues.push({ code: "part-without-device", severity: "error", message: `Part ${name || tag.line} needs library and deviceset`, line: tag.line })
      }
      records.push({ id: `part:${name || tag.line}`, kind: "part", fields: { name, library, deviceset, device: tag.attrs.device ?? "", line: tag.line } })
      continue
    }
    if (tag.name === "net") {
      const name = tag.attrs.name ?? ""
      if (!name) issues.push({ code: "net-without-name", severity: "error", message: "net has no name", line: tag.line })
      nets.add(name)
      records.push({ id: `net:${name || tag.line}`, kind: "net", fields: { name, line: tag.line } })
      continue
    }
    if (tag.name === "sheet") {
      sheets += 1
      records.push({ id: `sheet:${sheets}`, kind: "sheet", fields: { line: tag.line } })
      continue
    }
    if (tag.name === "signal") {
      records.push({ id: `signal:${tag.attrs.name ?? tag.line}`, kind: "signal", fields: { name: tag.attrs.name ?? "", line: tag.line } })
    }
  }

  if (!/\beagle\b/.test(text)) {
    issues.push({ code: "no-eagle", severity: "error", message: "File has no eagle root" })
  }
  if (parts.size === 0 && nets.size === 0) {
    issues.push({ code: "empty-design", severity: "warning", message: "Design has no parts and no nets" })
  }

  return {
    format: "EAGLE",
    records,
    meta: {
      parts: parts.size,
      nets: nets.size,
      sheets,
      signals: records.filter((record) => record.kind === "signal").length,
    },
    issues,
  }
}

const reference = [
  "EAGLE schematic or board (XML)",
  "",
  "<eagle version=\"9.6\">",
  "  <schematic>",
  "    <parts>",
  "      <part name=\"R1\" library=\"rcl\" deviceset=\"R\" device=\"\"/>",
  "    </parts>",
  "    <sheets>",
  "      <sheet>",
  "        <nets>",
  "          <net name=\"GND\"/>",
  "        </nets>",
  "      </sheet>",
  "    </sheets>",
  "  </schematic>",
  "</eagle>",
  "",
  "The root element is eagle.",
  "Every part needs name, library and deviceset.",
  "Part names must be unique; nets need a name.",
].join("\n")

export const format: FormatModule = {
  slug: "eagle-cad",
  displayName: "EAGLE",
  extensions: [".sch", ".brd"],
  description: "Parse EAGLE schematics and boards, validate parts, nets and sheets.",
  reference,
  parse,
  sample: () =>
    [
      '<?xml version="1.0"?>',
      '<eagle version="9.6">',
      "  <schematic>",
      "    <parts>",
      '      <part name="R1" library="rcl" deviceset="R" device=""/>',
      "    </parts>",
      "    <sheets>",
      "      <sheet>",
      "        <nets>",
      '          <net name="GND"/>',
      "        </nets>",
      "      </sheet>",
      "    </sheets>",
      "  </schematic>",
      "</eagle>",
    ].join("\n") + "\n",
}
