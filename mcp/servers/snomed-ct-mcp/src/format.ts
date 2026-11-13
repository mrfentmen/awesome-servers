import type { FormatModule, Parsed, ParsedRecord } from "./types.js"

function parse(text: string): Parsed {
  const issues: Parsed["issues"] = []
  const records: ParsedRecord[] = []
  const lines = text.split(/\r?\n/).filter((line) => line.trim().length > 0)
  if (lines.length === 0) {
    return { format: "SNOMED CT", records, meta: { rows: 0 }, issues: [{ code: "empty", severity: "error", message: "File is empty" }] }
  }

  const header = lines[0].split("\t").map((cell) => cell.trim())
  const lower = header.map((cell) => cell.toLowerCase())
  const idIndex = lower.indexOf("id") >= 0 ? lower.indexOf("id") : lower.indexOf("conceptid")
  const activeIndex = lower.indexOf("active")
  if (idIndex < 0) {
    issues.push({ code: "no-id-column", severity: "error", message: "RF2 file has no id or conceptId column", line: 1 })
  }
  if (activeIndex < 0) {
    issues.push({ code: "no-active-column", severity: "warning", message: "RF2 file has no active column", line: 1 })
  }

  let active = 0
  lines.slice(1).forEach((line, offset) => {
    const number = offset + 2
    const cells = line.split("\t")
    if (cells.length !== header.length) {
      issues.push({ code: "bad-width", severity: "error", message: `Row has ${cells.length} columns, header has ${header.length}`, line: number })
      return
    }
    const id = cells[idIndex] ?? ""
    if (!/^\d{6,18}$/.test(id)) {
      issues.push({ code: "bad-sctid", severity: "error", message: `SCTID must be 6 to 18 digits: ${id}`, line: number })
    }
    if (activeIndex >= 0) {
      const flag = cells[activeIndex]
      if (flag !== "0" && flag !== "1") {
        issues.push({ code: "bad-active", severity: "error", message: `active must be 0 or 1: ${flag}`, line: number })
      } else if (flag === "1") {
        active += 1
      }
    }
    records.push({
      id: `concept:${id}`,
      kind: "row",
      fields: { id, effectiveTime: cells[lower.indexOf("effectivetime")] ?? "", active: cells[activeIndex] ?? "", moduleId: cells[lower.indexOf("moduleid")] ?? "" },
    })
  })

  return {
    format: "SNOMED CT",
    records,
    meta: { rows: records.length, active, inactive: records.length - active, columns: header.length },
    issues,
  }
}

const reference = [
  "SNOMED CT RF2 release file (tab separated)",
  "",
  "id\teffectiveTime\tactive\tmoduleId\tdefinitionStatusId",
  "404684003\t20020131\t1\t900000000000207008\t900000000000074008",
  "",
  "The first row is the header; columns are separated by tabs.",
  "id is an SCTID of 6 to 18 digits.",
  "active is 1 for live concepts and 0 for inactive.",
].join("\n")

export const format: FormatModule = {
  slug: "snomed-ct",
  displayName: "SNOMED CT",
  extensions: [".tsv"],
  description: "Parse SNOMED CT RF2 files, validate SCTIDs, columns and active flags.",
  reference,
  parse,
  sample: () =>
    [
      "id\teffectiveTime\tactive\tmoduleId\tdefinitionStatusId",
      "404684003\t20020131\t1\t900000000000207008\t900000000000074008",
      "123037004\t20020131\t1\t900000000000207008\t900000000000074008",
    ].join("\n") + "\n",
}
