import type { FormatModule, Parsed, ParsedRecord } from "./types.js"
import { readRoot, scanTags, validateXml } from "./_xml.js"

const local = (name: string): string => (name.includes(":") ? name.slice(name.lastIndexOf(":") + 1) : name)

function parse(text: string): Parsed {
  const issues: Parsed["issues"] = []
  const root = readRoot(text)
  validateXml(text, root, "mzXML file", issues)

  const tags = scanTags(text)
  const records: ParsedRecord[] = []
  const scans = new Set<string>()
  let scanCount = 0
  let ms1 = 0
  let ms2 = 0

  for (const tag of tags) {
    if (tag.close) continue
    const name = local(tag.name)
    if (name === "msRun") {
      if (!tag.attrs.scanCount) issues.push({ code: "no-scan-count", severity: "warning", message: "msRun has no scanCount", line: tag.line })
      continue
    }
    if (name !== "scan") continue
    scanCount += 1
    const num = tag.attrs.num ?? ""
    if (!num) {
      issues.push({ code: "scan-without-num", severity: "error", message: "scan has no num", line: tag.line })
    } else if (scans.has(num)) {
      issues.push({ code: "duplicate-scan", severity: "error", message: `scan ${num} appears twice`, line: tag.line })
    }
    scans.add(num)
    const level = tag.attrs.msLevel ?? ""
    if (!/^\d+$/.test(level)) {
      issues.push({ code: "bad-ms-level", severity: "error", message: `msLevel must be a number: ${level || "(empty)"}`, line: tag.line })
    } else if (level === "1") {
      ms1 += 1
    } else {
      ms2 += 1
    }
    records.push({ id: `scan:${num || scanCount}`, kind: "scan", fields: { num, msLevel: level, line: tag.line } })
  }

  if (local(root) !== "mzXML") {
    issues.push({ code: "bad-root", severity: "error", message: `Root must be mzXML, found ${root || "nothing"}` })
  }
  if (scanCount === 0) issues.push({ code: "no-scans", severity: "error", message: "File has no scan" })

  return {
    format: "mzXML",
    records,
    meta: { scans: scanCount, ms1, ms2 },
    issues,
  }
}

const reference = [
  "mzXML mass spectrometry run",
  "",
  '<mzXML xmlns="http://sashimi.sourceforge.net/schema_revision/mzXML_3.2">',
  '  <msRun scanCount="2">',
  '    <scan num="1" msLevel="1" retentionTime="PT1.0S">',
  "      <peaks>...</peaks>",
  "    </scan>",
  '    <scan num="2" msLevel="2" precursorMz="500.2"/>',
  "  </msRun>",
  "</mzXML>",
  "",
  "Root is mzXML.",
  "scan nums are unique; msLevel is numeric.",
].join("\n")

export const format: FormatModule = {
  slug: "mzxml",
  displayName: "mzXML",
  extensions: [".mzxml"],
  description: "Parse mzXML runs, validate scans, msLevel and scan numbers.",
  reference,
  parse,
  sample: () =>
    [
      '<?xml version="1.0"?>',
      '<mzXML xmlns="http://sashimi.sourceforge.net/schema_revision/mzXML_3.2">',
      '  <msRun scanCount="2">',
      '    <scan num="1" msLevel="1" retentionTime="PT1.0S">',
      "      <peaks>...</peaks>",
      "    </scan>",
      '    <scan num="2" msLevel="2" precursorMz="500.2"/>',
      "  </msRun>",
      "</mzXML>",
    ].join("\n") + "\n",
}
