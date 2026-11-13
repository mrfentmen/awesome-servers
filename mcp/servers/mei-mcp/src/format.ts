import type { FormatModule, Parsed, ParsedRecord } from "./types.js"
import { readRoot, scanTags, validateXml } from "./_xml.js"

const local = (name: string): string => (name.includes(":") ? name.slice(name.lastIndexOf(":") + 1) : name)
const PITCHES = new Set(["a", "b", "c", "d", "e", "f", "g"])

function parse(text: string): Parsed {
  const issues: Parsed["issues"] = []
  const root = readRoot(text)
  validateXml(text, root, "MEI file", issues)

  const tags = scanTags(text)
  const records: ParsedRecord[] = []
  const ids = new Set<string>()
  let head = 0
  let music = 0
  let measures = 0
  let notes = 0
  let staves = 0

  for (const tag of tags) {
    if (tag.close) continue
    const name = local(tag.name)
    const xmlId = tag.attrs["xml:id"] ?? ""
    if (xmlId) {
      if (ids.has(xmlId)) issues.push({ code: "duplicate-id", severity: "error", message: `xml:id ${xmlId} appears twice`, line: tag.line })
      ids.add(xmlId)
    }
    if (name === "meiHead") {
      head += 1
      continue
    }
    if (name === "music") {
      music += 1
      continue
    }
    if (name === "measure") {
      measures += 1
      const n = tag.attrs.n ?? ""
      if (n && !/^\d+$/.test(n)) issues.push({ code: "bad-measure-number", severity: "error", message: `measure n must be an integer: ${n}`, line: tag.line })
      records.push({ id: `measure:${n || measures}`, kind: "measure", fields: { n, line: tag.line } })
      continue
    }
    if (name === "staff") {
      staves += 1
      continue
    }
    if (name === "note") {
      notes += 1
      const pname = tag.attrs.pname ?? ""
      if (pname && !PITCHES.has(pname)) {
        issues.push({ code: "bad-pitch", severity: "error", message: `note pname must be a-g: ${pname}`, line: tag.line })
      }
      const oct = tag.attrs.oct ?? ""
      if (oct && !/^\d$/.test(oct)) issues.push({ code: "bad-octave", severity: "error", message: `note oct must be one digit: ${oct}`, line: tag.line })
      records.push({ id: `note:${records.length + 1}`, kind: "note", fields: { pname, oct, dur: tag.attrs.dur ?? "", line: tag.line } })
    }
  }

  if (local(root) !== "mei") {
    issues.push({ code: "bad-root", severity: "error", message: `Root must be mei, found ${root || "nothing"}` })
  }
  if (head === 0) issues.push({ code: "no-head", severity: "error", message: "File has no meiHead" })
  if (music === 0) issues.push({ code: "no-music", severity: "error", message: "File has no music element" })
  if (measures === 0) issues.push({ code: "no-measures", severity: "warning", message: "File has no measure" })

  return {
    format: "MEI",
    records,
    meta: { measures, notes, staves, ids: ids.size },
    issues,
  }
}

const reference = [
  "MEI (Music Encoding Initiative, XML)",
  "",
  '<mei xmlns="http://www.music-encoding.org/ns/mei" meiversion="5.0">',
  '  <meiHead><fileDesc><titleStmt><title>Demo</title></titleStmt></fileDesc></meiHead>',
  "  <music><body><mdiv><score>",
  '    <scoreDef><staffGrp><staffDef n="1" lines="5"/></staffGrp></scoreDef>',
  "    <section><measure n=\"1\"><staff n=\"1\"><layer n=\"1\">",
  '      <note pname="c" oct="4" dur="4"/>',
  "    </layer></staff></measure></section>",
  "  </score></mdiv></body></music>",
  "</mei>",
  "",
  "Root is mei and needs meiHead and music.",
  "Measures carry a numeric n.",
  "Notes use pname a-g and a one-digit octave.",
].join("\n")

export const format: FormatModule = {
  slug: "mei",
  displayName: "MEI",
  extensions: [".mei"],
  description: "Parse MEI scores, validate heads, measures, staves and notes.",
  reference,
  parse,
  sample: () =>
    [
      '<?xml version="1.0"?>',
      '<mei xmlns="http://www.music-encoding.org/ns/mei" meiversion="5.0">',
      "  <meiHead><fileDesc><titleStmt><title>Demo</title></titleStmt></fileDesc></meiHead>",
      "  <music><body><mdiv><score>",
      '    <scoreDef><staffGrp><staffDef n="1" lines="5"/></staffGrp></scoreDef>',
      '    <section><measure n="1"><staff n="1"><layer n="1">',
      '      <note pname="c" oct="4" dur="4"/>',
      '      <note pname="e" oct="4" dur="4"/>',
      "    </layer></staff></measure></section>",
      "  </score></mdiv></body></music>",
      "</mei>",
    ].join("\n") + "\n",
}
