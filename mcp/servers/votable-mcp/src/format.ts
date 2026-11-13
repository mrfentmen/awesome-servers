import type { FormatModule, Parsed, ParsedRecord } from "./types.js"
import { readRoot, scanTags, validateXml } from "./_xml.js"

const local = (name: string): string => (name.includes(":") ? name.slice(name.lastIndexOf(":") + 1) : name)

function parse(text: string): Parsed {
  const issues: Parsed["issues"] = []
  const root = readRoot(text)
  validateXml(text, root, "VOTable", issues)

  const tags = scanTags(text)
  const records: ParsedRecord[] = []
  const fields: string[] = []
  let tables = 0
  let rows = 0
  let tableFields = 0

  for (const tag of tags) {
    if (tag.close) continue
    const name = local(tag.name)
    if (name === "TABLE") {
      tables += 1
      tableFields = 0
      continue
    }
    if (name === "FIELD") {
      const field = tag.attrs.name ?? ""
      if (!field) issues.push({ code: "field-name", severity: "error", message: "FIELD has no name", line: tag.line })
      else {
        fields.push(field)
        tableFields += 1
      }
      if (tag.attrs.datatype && !["boolean", "bit", "unsignedByte", "short", "int", "long", "char", "unicodeChar", "float", "double", "floatComplex", "doubleComplex"].includes(tag.attrs.datatype)) {
        issues.push({ code: "bad-datatype", severity: "error", message: `Unknown FIELD datatype: ${tag.attrs.datatype}`, line: tag.line })
      }
    }
  }

  const rowRe = /<TR\b[^>]*>([\s\S]*?)<\/TR>/gi
  let match: RegExpExecArray | null
  while ((match = rowRe.exec(text)) !== null) {
    rows += 1
    const cells = (match[1].match(/<TD\b[^>]*>/gi) ?? []).length
    if (tableFields > 0 && cells !== tableFields) {
      issues.push({ code: "cell-count", severity: "error", message: `Row has ${cells} cells but the table declares ${tableFields} fields` })
    }
    records.push({ id: `row:${rows}`, kind: "row", fields: { cells, line: text.slice(0, match.index).split("\n").length } })
  }

  if (local(root) !== "VOTABLE") issues.push({ code: "bad-root", severity: "error", message: `Root must be VOTABLE, found ${root || "nothing"}` })
  if (fields.length === 0) issues.push({ code: "no-fields", severity: "error", message: "VOTable has no FIELD" })
  if (tables === 0) issues.push({ code: "no-table", severity: "error", message: "VOTable has no TABLE" })
  if (rows === 0) issues.push({ code: "no-rows", severity: "warning", message: "VOTable has no data rows" })

  return { format: "VOTable", records, meta: { tables, fields: fields.length, rows }, issues }
}

const reference = [
  "VOTable astronomy table",
  "",
  '<VOTABLE version="1.4" xmlns="http://www.ivoa.net/xml/VOTable/v1.3">',
  "  <RESOURCE>",
  "    <TABLE>",
  '      <FIELD name="RA" datatype="double" unit="deg"/>',
  '      <FIELD name="DEC" datatype="double" unit="deg"/>',
  "      <DATA><TABLEDATA>",
  "        <TR><TD>10.5</TD><TD>-20.1</TD></TR>",
  "      </TABLEDATA></DATA>",
  "    </TABLE>",
  "  </RESOURCE>",
  "</VOTABLE>",
  "",
  "Each TABLE lists FIELD elements, then rows of TD cells.",
  "Every row must have one cell per field.",
].join("\n")

export const format: FormatModule = {
  slug: "votable",
  displayName: "VOTable",
  extensions: [".vot", ".xml"],
  description: "Parse VOTable astronomy tables, validate fields, datatypes and row widths.",
  reference,
  parse,
  sample: () =>
    [
      '<?xml version="1.0"?>',
      '<VOTABLE version="1.4" xmlns="http://www.ivoa.net/xml/VOTable/v1.3">',
      "  <RESOURCE>",
      "    <TABLE>",
      '      <FIELD name="RA" datatype="double" unit="deg"/>',
      '      <FIELD name="DEC" datatype="double" unit="deg"/>',
      '      <FIELD name="NAME" datatype="char" arraysize="*"/>',
      "      <DATA><TABLEDATA>",
      "        <TR><TD>10.5</TD><TD>-20.1</TD><TD>Demo</TD></TR>",
      "        <TR><TD>11.0</TD><TD>-21.0</TD><TD>Other</TD></TR>",
      "      </TABLEDATA></DATA>",
      "    </TABLE>",
      "  </RESOURCE>",
      "</VOTABLE>",
    ].join("\n") + "\n",
}
