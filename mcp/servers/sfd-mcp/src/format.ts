import type { FormatModule, Parsed, ParsedRecord } from "./types.js"

function parse(text: string): Parsed {
  const issues: Parsed["issues"] = []
  const records: ParsedRecord[] = []
  const lines = text.split(/\r?\n/)
  let header = ""
  let fontName = ""
  let declared = -1
  let chars = 0
  let inChar = false
  let ended = false

  for (const [index, raw] of lines.entries()) {
    const line = raw.trim()
    const lineNo = index + 1
    if (!line) continue
    if (line.startsWith("SplineFontDB:")) {
      header = line.slice("SplineFontDB:".length).trim()
      continue
    }
    if (line.startsWith("FontName:")) {
      fontName = line.slice("FontName:".length).trim()
      continue
    }
    if (line.startsWith("BeginChars:")) {
      const parts = line.split(/\s+/)
      const count = Number(parts[2])
      if (!Number.isInteger(count) || count < 0) issues.push({ code: "bad-char-count", severity: "error", message: `Bad BeginChars count: ${line}`, line: lineNo })
      else declared = count
      continue
    }
    if (line.startsWith("StartChar:")) {
      if (inChar) issues.push({ code: "nested-char", severity: "error", message: "StartChar before previous EndChar", line: lineNo })
      inChar = true
      chars += 1
      const name = line.slice("StartChar:".length).trim()
      records.push({ id: `char:${name || chars}`, kind: "char", fields: { name, line: lineNo } })
      continue
    }
    if (line.startsWith("EndChars")) {
      ended = true
      inChar = false
      continue
    }
    if (line.startsWith("EndChar")) {
      if (!inChar) issues.push({ code: "stray-end", severity: "error", message: "EndChar without StartChar", line: lineNo })
      inChar = false
      continue
    }
  }

  if (!header) issues.push({ code: "no-header", severity: "error", message: "Missing SplineFontDB header" })
  if (!fontName) issues.push({ code: "no-font-name", severity: "error", message: "Missing FontName" })
  if (!ended) issues.push({ code: "no-endchars", severity: "error", message: "Missing EndChars" })
  if (inChar) issues.push({ code: "open-char", severity: "error", message: "Last StartChar has no EndChar" })
  if (declared >= 0 && declared !== chars) issues.push({ code: "char-count", severity: "error", message: `BeginChars says ${declared} chars, found ${chars}` })
  if (chars === 0) issues.push({ code: "no-chars", severity: "error", message: "Font has no characters" })

  return { format: "SFD", records, meta: { fontName, chars, declared, splineVersion: header }, issues }
}

const reference = [
  "FontForge SFD source",
  "",
  "SplineFontDB: 3.0",
  "FontName: Demo",
  "FullName: Demo Regular",
  "FamilyName: Demo",
  "Weight: Regular",
  "Encoding: ISO8859-1",
  "BeginChars: 256 2",
  "StartChar: space",
  "Encoding: 32 32 0",
  "Width: 250",
  "EndChar",
  "StartChar: A",
  "Encoding: 65 65 0",
  "Width: 600",
  "EndChar",
  "EndChars",
  "EndSplineFont",
  "",
  "BeginChars second number is the character count.",
  "Every StartChar needs an EndChar.",
  "EndChars closes the character list.",
].join("\n")

export const format: FormatModule = {
  slug: "sfd",
  displayName: "SFD",
  extensions: [".sfd"],
  description: "Parse FontForge SFD sources, validate headers, characters and counts.",
  reference,
  parse,
  sample: () =>
    [
      "SplineFontDB: 3.0",
      "FontName: Demo",
      "FullName: Demo Regular",
      "FamilyName: Demo",
      "Weight: Regular",
      "Encoding: ISO8859-1",
      "BeginChars: 256 3",
      "StartChar: space",
      "Encoding: 32 32 0",
      "Width: 250",
      "EndChar",
      "StartChar: A",
      "Encoding: 65 65 0",
      "Width: 600",
      "EndChar",
      "StartChar: B",
      "Encoding: 66 66 0",
      "Width: 620",
      "EndChar",
      "EndChars",
      "EndSplineFont",
    ].join("\n") + "\n",
}
