import type { FormatModule, Parsed, ParsedRecord } from "./types.js"
import { readRoot, scanTags, validateXml } from "./_xml.js"

const local = (name: string): string => (name.includes(":") ? name.slice(name.lastIndexOf(":") + 1) : name)

function parse(text: string): Parsed {
  const issues: Parsed["issues"] = []
  const root = readRoot(text)
  validateXml(text, root, "MusicXML score", issues)

  const tags = scanTags(text)
  const records: ParsedRecord[] = []
  let parts = 0
  let measures = 0
  let notes = 0
  let inNote = false
  let noteDuration = ""
  const partIds = new Set<string>()

  for (const tag of tags) {
    const name = local(tag.name)
    if (tag.close) {
      if (name === "note") {
        inNote = false
        if (!noteDuration) {
          issues.push({ code: "note-without-duration", severity: "error", message: "note has no duration", line: tag.line })
        }
        noteDuration = ""
      }
      continue
    }
    if (name === "score-part") {
      parts += 1
      const id = tag.attrs.id ?? ""
      if (!id) issues.push({ code: "part-without-id", severity: "error", message: "score-part has no id", line: tag.line })
      if (partIds.has(id)) issues.push({ code: "duplicate-part", severity: "error", message: `Part ${id} appears twice`, line: tag.line })
      partIds.add(id)
      records.push({ id: `part:${id || parts}`, kind: "part", fields: { id, line: tag.line } })
      continue
    }
    if (name === "measure") {
      measures += 1
      const number = tag.attrs.number ?? ""
      if (number && !/^\d+$/.test(number)) {
        issues.push({ code: "bad-measure-number", severity: "error", message: `Measure number must be an integer: ${number}`, line: tag.line })
      }
      records.push({ id: `measure:${measures}`, kind: "measure", fields: { number, part: tag.attrs.id ?? "", line: tag.line } })
      continue
    }
    if (name === "note") {
      notes += 1
      inNote = true
      records.push({ id: `note:${notes}`, kind: "note", fields: { line: tag.line } })
      continue
    }
    if (name === "duration" && inNote) {
      noteDuration = tag.attrs.value ?? "present"
    }
  }

  const rootName = local(root)
  if (rootName !== "score-partwise" && rootName !== "score-timewise") {
    issues.push({ code: "bad-root", severity: "error", message: `Root must be score-partwise or score-timewise, found ${rootName || "nothing"}` })
  }
  if (parts === 0) issues.push({ code: "no-parts", severity: "error", message: "Score has no score-part" })
  if (measures === 0) issues.push({ code: "no-measures", severity: "warning", message: "Score has no measure" })

  return {
    format: "MusicXML",
    records,
    meta: { root: rootName, parts, measures, notes },
    issues,
  }
}

const reference = [
  "MusicXML score",
  "",
  "<score-partwise version=\"4.0\">",
  "  <part-list>",
  "    <score-part id=\"P1\"><part-name>Piano</part-name></score-part>",
  "  </part-list>",
  "  <part id=\"P1\">",
  "    <measure number=\"1\">",
  "      <note><pitch><step>C</step><octave>4</octave></pitch><duration>4</duration></note>",
  "    </measure>",
  "  </part>",
  "</score-partwise>",
  "",
  "Root is score-partwise or score-timewise.",
  "Parts need unique ids; measures need numeric numbers.",
  "Every note needs a duration.",
].join("\n")

export const format: FormatModule = {
  slug: "musicxml",
  displayName: "MusicXML",
  extensions: [".musicxml", ".mxl"],
  description: "Parse MusicXML scores, validate parts, measures and note durations.",
  reference,
  parse,
  sample: () =>
    [
      '<?xml version="1.0"?>',
      '<score-partwise version="4.0">',
      "  <part-list>",
      '    <score-part id="P1"><part-name>Piano</part-name></score-part>',
      "  </part-list>",
      '  <part id="P1">',
      '    <measure number="1">',
      "      <note><pitch><step>C</step><octave>4</octave></pitch><duration>4</duration></note>",
      "    </measure>",
      "  </part>",
      "</score-partwise>",
    ].join("\n") + "\n",
}
