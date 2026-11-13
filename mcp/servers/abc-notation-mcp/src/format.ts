import type { FormatModule, Parsed, ParsedRecord } from "./types.js"

const NOTE = /[\^_=]?[A-Ga-g][,']*(?:\d+\/\d+|\/?\d*)?/g

function parse(text: string): Parsed {
  const issues: Parsed["issues"] = []
  const records: ParsedRecord[] = []
  const headers = new Map<string, string>()
  let tunes = 0
  let body = ""
  let inBody = false

  for (const [index, raw] of text.split(/\r?\n/).entries()) {
    const line = raw.trim()
    const lineNo = index + 1
    if (!line || line.startsWith("%")) continue
    const header = /^([A-Za-z]):\s*(.*)$/.exec(line)
    if (header && !inBody) {
      const key = header[1]
      headers.set(key, header[2].trim())
      if (key === "X") tunes += 1
      if (key === "K") inBody = true
      continue
    }
    if (inBody) body += ` ${line}`
  }

  const x = headers.get("X") ?? ""
  const t = headers.get("T") ?? ""
  const m = headers.get("M") ?? ""
  const l = headers.get("L") ?? ""
  const k = headers.get("K") ?? ""
  if (!x) issues.push({ code: "no-x", severity: "error", message: "Missing X: tune number" })
  else if (!/^\d+$/.test(x)) issues.push({ code: "bad-x", severity: "error", message: `X must be an integer: ${x}` })
  if (!t) issues.push({ code: "no-title", severity: "error", message: "Missing T: title" })
  if (!m) issues.push({ code: "no-meter", severity: "error", message: "Missing M: meter" })
  else if (!/^(?:\d+\/\d+|C|C\|)$/.test(m)) issues.push({ code: "bad-meter", severity: "error", message: `Bad meter: ${m}` })
  if (!l) issues.push({ code: "no-length", severity: "error", message: "Missing L: default note length" })
  if (!k) issues.push({ code: "no-key", severity: "error", message: "Missing K: key" })
  if (!inBody) issues.push({ code: "no-body", severity: "error", message: "No music body after K:" })

  const notes = body.match(NOTE) ?? []
  if (notes.length === 0) issues.push({ code: "no-notes", severity: "error", message: "Body has no notes" })
  records.push({ id: `tune:${x || 1}`, kind: "tune", fields: { title: t, meter: m, length: l, key: k, notes: notes.length } })

  return { format: "ABC", records, meta: { tunes, notes: notes.length }, issues }
}

const reference = [
  "ABC music notation",
  "",
  "X:1",
  "T:Demo Tune",
  "M:4/4",
  "L:1/8",
  "K:G",
  "G2 A2 B2 c2 | d2 e2 f2 g2 |",
  "",
  "X is the tune number.",
  "T, M, L and K are required headers.",
  "K must be the last header; music follows it.",
].join("\n")

export const format: FormatModule = {
  slug: "abc-notation",
  displayName: "ABC",
  extensions: [".abc"],
  description: "Parse ABC tunes, validate headers, meter, key and note body.",
  reference,
  parse,
  sample: () =>
    ["X:1", "T:Demo Tune", "M:4/4", "L:1/8", "K:G", "G2 A2 B2 c2 | d2 e2 f2 g2 |"].join("\n") + "\n",
}
