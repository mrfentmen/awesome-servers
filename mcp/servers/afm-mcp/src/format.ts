import type { FormatModule, Parsed, ParsedRecord } from "./types.js"

function parse(text: string): Parsed {
  const issues: Parsed["issues"] = []
  const records: ParsedRecord[] = []
  const lines = text.split(/\r?\n/)
  let started = false
  let ended = false
  let fontName = ""
  let declared = -1
  let glyphs = 0
  let inMetrics = false

  for (const [index, raw] of lines.entries()) {
    const line = raw.trim()
    const lineNo = index + 1
    if (!line) continue
    if (line.startsWith("StartFontMetrics")) {
      started = true
      continue
    }
    if (line.startsWith("EndFontMetrics")) {
      ended = true
      continue
    }
    if (line.startsWith("FontName")) {
      fontName = line.slice("FontName".length).trim()
      continue
    }
    if (line.startsWith("StartCharMetrics")) {
      inMetrics = true
      const count = Number(line.split(/\s+/)[1])
      if (!Number.isInteger(count) || count < 0) issues.push({ code: "bad-metrics-count", severity: "error", message: `Bad StartCharMetrics count: ${line}`, line: lineNo })
      else declared = count
      continue
    }
    if (line.startsWith("EndCharMetrics")) {
      inMetrics = false
      continue
    }
    if (!inMetrics) continue
    if (!line.startsWith("C ")) {
      issues.push({ code: "bad-metric-line", severity: "error", message: "Char metric lines must start with C", line: lineNo })
      continue
    }
    const width = /WX\s+(-?\d+(?:\.\d+)?)/.exec(line)
    const name = /N\s+([^\s;]+)/.exec(line)
    if (!width) issues.push({ code: "no-width", severity: "error", message: "Char metric has no WX", line: lineNo })
    if (!name) issues.push({ code: "no-name", severity: "error", message: "Char metric has no N", line: lineNo })
    glyphs += 1
    records.push({ id: `glyph:${name?.[1] ?? glyphs}`, kind: "glyph", fields: { width: width ? Number(width[1]) : null, line: lineNo } })
  }

  if (!started) issues.push({ code: "no-header", severity: "error", message: "Missing StartFontMetrics" })
  if (!ended) issues.push({ code: "no-footer", severity: "error", message: "Missing EndFontMetrics" })
  if (!fontName) issues.push({ code: "no-font-name", severity: "error", message: "Missing FontName" })
  if (declared >= 0 && declared !== glyphs) issues.push({ code: "glyph-count", severity: "error", message: `StartCharMetrics says ${declared} glyphs, found ${glyphs}` })
  if (glyphs === 0) issues.push({ code: "no-glyphs", severity: "error", message: "Font has no char metrics" })

  return { format: "AFM", records, meta: { fontName, glyphs, declared }, issues }
}

const reference = [
  "Adobe Font Metrics",
  "",
  "StartFontMetrics 4.1",
  "FontName Demo-Regular",
  "Ascender 750",
  "Descender -250",
  "StartCharMetrics 2",
  "C 32 ; WX 250 ; N space ; B 0 0 0 0 ;",
  "C 65 ; WX 600 ; N A ; B 20 0 580 700 ;",
  "EndCharMetrics",
  "EndFontMetrics",
  "",
  "Metrics are wrapped by StartFontMetrics and EndFontMetrics.",
  "StartCharMetrics N must match the number of C lines.",
  "Each C line carries WX width and N name.",
].join("\n")

export const format: FormatModule = {
  slug: "afm",
  displayName: "AFM",
  extensions: [".afm"],
  description: "Parse Adobe Font Metrics, validate headers, glyph counts and widths.",
  reference,
  parse,
  sample: () =>
    [
      "StartFontMetrics 4.1",
      "FontName Demo-Regular",
      "Ascender 750",
      "Descender -250",
      "StartCharMetrics 3",
      "C 32 ; WX 250 ; N space ; B 0 0 0 0 ;",
      "C 65 ; WX 600 ; N A ; B 20 0 580 700 ;",
      "C 66 ; WX 620 ; N B ; B 20 0 600 700 ;",
      "EndCharMetrics",
      "EndFontMetrics",
    ].join("\n") + "\n",
}
