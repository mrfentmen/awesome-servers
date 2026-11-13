import type { FormatModule, Parsed, ParsedRecord } from "./types.js"

function parse(text: string): Parsed {
  const issues: Parsed["issues"] = []
  const records: ParsedRecord[] = []
  const names = new Set<string>()
  let version = ""
  let blocks = 0
  let depth = 0
  let projects = 0
  let measurements = 0
  let characteristics = 0

  for (const [index, raw] of text.split(/\r?\n/).entries()) {
    const line = raw.trim()
    if (!line || line.startsWith("//")) continue
    const lineNo = index + 1

    const versionMatch = /^ASAP2_VERSION\s+(\d+)\s+(\d+)/.exec(line)
    if (versionMatch) {
      version = `${versionMatch[1]}.${versionMatch[2]}`
      continue
    }
    if (/^\/begin\b/.test(line)) {
      blocks += 1
      depth += 1
      const kind = line.split(/\s+/)[1] ?? ""
      if (kind === "PROJECT") projects += 1
      records.push({ id: `block:${blocks}`, kind: kind || "block", fields: { kind, line: lineNo } })
      continue
    }
    if (/^\/end\b/.test(line)) {
      depth -= 1
      if (depth < 0) {
        issues.push({ code: "unbalanced", severity: "error", message: "More /end than /begin", line: lineNo })
        depth = 0
      }
      continue
    }
    const decl = /^(MEASUREMENT|CHARACTERISTIC|AXIS_PTS|COMPU_METHOD|RECORD_LAYOUT|FUNCTION)\s+([A-Za-z_]\w*)/.exec(line)
    if (decl) {
      const kind = decl[1]
      const name = decl[2]
      if (names.has(name)) {
        issues.push({ code: "duplicate-name", severity: "error", message: `Name ${name} is declared twice`, line: lineNo })
      }
      names.add(name)
      if (kind === "MEASUREMENT") measurements += 1
      if (kind === "CHARACTERISTIC") characteristics += 1
      records.push({ id: `${kind}:${name}`, kind, fields: { name, line: lineNo } })
    }
  }

  if (!version) issues.push({ code: "no-version", severity: "error", message: "File has no ASAP2_VERSION line" })
  if (projects === 0) issues.push({ code: "no-project", severity: "error", message: "File has no PROJECT block" })
  if (depth !== 0) issues.push({ code: "unbalanced", severity: "error", message: `${depth} /begin block(s) are not closed` })
  if (measurements === 0 && characteristics === 0) {
    issues.push({ code: "no-objects", severity: "warning", message: "No MEASUREMENT or CHARACTERISTIC declared" })
  }

  return {
    format: "A2L",
    records,
    meta: { version, blocks, projects, measurements, characteristics },
    issues,
  }
}

const reference = [
  "ASAM A2L / ASAP2 calibration file",
  "",
  "ASAP2_VERSION 1 61",
  '/begin PROJECT Demo ""',
  '  /begin MODULE Engine ""',
  '    /begin MEASUREMENT Speed "Vehicle speed" UWORD 0 300',
  "    /end MEASUREMENT",
  "  /end MODULE",
  "/end PROJECT",
  "",
  "The first line is ASAP2_VERSION.",
  "Every /begin has a matching /end.",
  "MEASUREMENT and CHARACTERISTIC names must be unique.",
].join("\n")

export const format: FormatModule = {
  slug: "a2l",
  displayName: "A2L",
  extensions: [".a2l"],
  description: "Parse ASAM A2L calibration files, validate blocks, measurements and names.",
  reference,
  parse,
  sample: () =>
    [
      "ASAP2_VERSION 1 61",
      '/begin PROJECT Demo ""',
      '  /begin MODULE Engine ""',
      '    /begin MEASUREMENT Speed "Vehicle speed" UWORD 0 300',
      "    /end MEASUREMENT",
      '    /begin CHARACTERISTIC FuelMap "Fuel map" MAP 1.0',
      "    /end CHARACTERISTIC",
      "  /end MODULE",
      "/end PROJECT",
    ].join("\n") + "\n",
}
