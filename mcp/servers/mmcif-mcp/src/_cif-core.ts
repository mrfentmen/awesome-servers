import type { Parsed, ParsedRecord } from "./types.js"

function unquote(value: string): string {
  const trimmed = value.trim()
  if (trimmed.startsWith("'") && trimmed.endsWith("'")) return trimmed.slice(1, -1).replace(/''/g, "'")
  return trimmed
}

export function parseCif(text: string, formatName: string): Parsed {
  const issues: Parsed["issues"] = []
  const records: ParsedRecord[] = []
  const lines = text.split(/\r?\n/)
  let block = ""
  let loopTags: string[] = []
  let inLoop = false
  let loopCells = 0
  let atoms = 0
  let tags = 0
  let textBlock = false

  lines.forEach((raw, index) => {
    const number = index + 1
    if (textBlock) {
      if (raw.startsWith(";")) textBlock = false
      return
    }
    if (raw.startsWith(";")) {
      textBlock = true
      return
    }

    const line = raw.trim()
    if (line.length === 0 || line.startsWith("#")) {
      inLoop = false
      loopTags = []
      return
    }

    const data = /^data_(\S+)$/i.exec(line)
    if (data) {
      block = data[1]
      inLoop = false
      loopTags = []
      return
    }

    if (/^loop_$/i.test(line)) {
      inLoop = true
      loopTags = []
      return
    }

    if (line.startsWith("_")) {
      const parts = line.split(/\s+/)
      tags += 1
      if (inLoop) {
        loopTags.push(parts[0])
        loopCells = loopTags.length
      } else if (parts.length < 2) {
        issues.push({ code: "tag-without-value", severity: "error", message: `Tag ${parts[0]} has no value`, line: number })
      }
      return
    }

    if (inLoop) {
      const cells = line.match(/'[^']*'|\S+/g) ?? []
      if (cells.length !== loopCells) {
        issues.push({
          code: "loop-column-count",
          severity: "error",
          message: `Loop row has ${cells.length} values but ${loopCells} tags`,
          line: number,
        })
      }
      const id = loopTags.findIndex((tag) => /\.id$/i.test(tag))
      const label = loopTags.findIndex((tag) => /label$/i.test(tag))
      const row: Record<string, string> = {}
      loopTags.forEach((tag, position) => {
        row[tag] = unquote(cells[position] ?? "")
      })
      const key = id >= 0 ? row[loopTags[id]] : label >= 0 ? row[loopTags[label]] : String(atoms + 1)
      if (/atom_site/i.test(loopTags[0] ?? "")) atoms += 1
      records.push({
        id: `${key}`,
        kind: (loopTags[0] ?? "row").split(".")[0],
        fields: { block, ...row },
      })
      return
    }

    records.push({ id: line.split(/\s+/)[0], kind: "tag", fields: { block, raw: line } })
  })

  if (!block && !/data_/i.test(text)) {
    issues.push({ code: "missing-data", severity: "error", message: "File has no data_ block header", line: 1 })
  }

  return {
    format: formatName,
    records,
    meta: { block, tags, loops: records.filter((record) => record.kind !== "tag").length, atoms, rows: records.length },
    issues,
  }
}
