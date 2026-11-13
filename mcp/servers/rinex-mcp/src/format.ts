import type { FormatModule, Parsed, ParsedRecord } from "./types.js"

const pad = (label: string): string => label.padStart(60)

function parse(text: string): Parsed {
  const issues: Parsed["issues"] = []
  const records: ParsedRecord[] = []
  const lines = text.split(/\r?\n/)
  let version = false
  let endHeader = false
  let epochs = 0
  let sats = 0
  let inEpoch = false
  let expectedSats = 0

  for (const [index, line] of lines.entries()) {
    const lineNo = index + 1
    if (!endHeader) {
      if (line.length < 60) continue
      const label = line.slice(60).trim()
      if (label === "RINEX VERSION / TYPE") {
        version = true
        if (!/^\s*3\./.test(line)) issues.push({ code: "bad-version", severity: "error", message: "Only RINEX 3 headers are accepted", line: lineNo })
      }
      if (label === "END OF HEADER") endHeader = true
      continue
    }
    if (!line.trim()) continue
    if (line.startsWith(">")) {
      epochs += 1
      inEpoch = true
      const fields = line.slice(1).trim().split(/\s+/)
      expectedSats = Number(fields[fields.length - 1])
      if (!Number.isInteger(expectedSats) || expectedSats < 0) {
        issues.push({ code: "bad-sat-count", severity: "error", message: `Epoch satellite count is not a number: ${fields[fields.length - 1]}`, line: lineNo })
      }
      records.push({ id: `epoch:${epochs}`, kind: "epoch", fields: { sats: expectedSats, line: lineNo } })
      continue
    }
    if (!inEpoch) {
      issues.push({ code: "stray-line", severity: "error", message: "Observation line appears before any epoch", line: lineNo })
      continue
    }
    const parts = line.trim().split(/\s+/)
    if (!/^[GRECJSI]\d{2}$/.test(parts[0] ?? "")) {
      issues.push({ code: "bad-satellite", severity: "error", message: `Bad satellite id: ${parts[0] ?? "(empty)"}`, line: lineNo })
    }
    for (const value of parts.slice(1)) {
      if (!Number.isFinite(Number(value))) issues.push({ code: "bad-observation", severity: "error", message: `Observation is not numeric: ${value}`, line: lineNo })
    }
    sats += 1
  }

  if (!version) issues.push({ code: "no-version", severity: "error", message: "Missing RINEX VERSION / TYPE header" })
  if (!endHeader) issues.push({ code: "no-header-end", severity: "error", message: "Missing END OF HEADER" })
  if (epochs === 0) issues.push({ code: "no-epochs", severity: "error", message: "File has no observation epochs" })
  if (epochs > 0 && sats < epochs) issues.push({ code: "no-observations", severity: "error", message: "Epochs have no satellite observations" })

  return { format: "RINEX", records, meta: { epochs, sats }, issues }
}

const reference = [
  "RINEX 3 observation file",
  "",
  "Header lines carry a label starting at column 61.",
  pad("RINEX VERSION / TYPE"),
  pad("END OF HEADER"),
  "",
  "> 2026 11 13 00 00  0.0000000  0  2",
  "G01  12345678.123  123456.789",
  "G02  23456789.123  234567.890",
  "",
  "An epoch starts with > and ends with the satellite count.",
  "Satellite lines start with a system letter and two-digit PRN.",
  "Observation values must be numeric.",
].join("\n")

export const format: FormatModule = {
  slug: "rinex",
  displayName: "RINEX",
  extensions: [".rnx", ".obs"],
  description: "Parse RINEX 3 observations, validate headers, epochs and satellite lines.",
  reference,
  parse,
  sample: () =>
    [
      "     3.03           OBSERVATION DATA    G".padEnd(60) + "RINEX VERSION / TYPE",
      "demo                demo                20261113 000000 UTC".padEnd(60) + "PGM / RUN BY / DATE",
      "G    2 C1C L1C".padEnd(60) + "SYS / # / OBS TYPES",
      "".padEnd(60) + "END OF HEADER",
      "> 2026 11 13 00 00  0.0000000  0  2",
      "G01  12345678.123  123456.789",
      "G02  23456789.123  234567.890",
    ].join("\n") + "\n",
}
