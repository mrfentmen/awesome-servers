import type { FormatModule, Parsed, ParsedRecord } from "./types.js"
import { readRoot, scanTags, validateXml } from "./_xml.js"

const local = (name: string): string => (name.includes(":") ? name.slice(name.lastIndexOf(":") + 1) : name)

function parse(text: string): Parsed {
  const issues: Parsed["issues"] = []
  const root = readRoot(text)
  validateXml(text, root, "METS document", issues)

  const tags = scanTags(text)
  const records: ParsedRecord[] = []
  const files = new Set<string>()
  const references: Array<{ id: string; line: number }> = []
  let headers = 0
  let dmdSections = 0
  let fileGroups = 0
  let structMaps = 0
  let divs = 0

  for (const tag of tags) {
    if (tag.close) continue
    const name = local(tag.name)
    if (name === "metsHdr") {
      headers += 1
      records.push({ id: "header", kind: "header", fields: { created: tag.attrs.CREATEDATE ?? "", line: tag.line } })
      continue
    }
    if (name === "dmdSec") {
      dmdSections += 1
      continue
    }
    if (name === "fileGrp") {
      fileGroups += 1
      continue
    }
    if (name === "file") {
      const id = tag.attrs.ID ?? ""
      if (!id) issues.push({ code: "file-without-id", severity: "error", message: "file has no ID", line: tag.line })
      files.add(id)
      records.push({ id: `file:${id || files.size}`, kind: "file", fields: { id, href: tag.attrs.HREF ?? "", line: tag.line } })
      continue
    }
    if (name === "structMap") {
      structMaps += 1
      continue
    }
    if (name === "div") {
      divs += 1
      continue
    }
    if (name === "fptr") {
      references.push({ id: tag.attrs.FILEID ?? "", line: tag.line })
    }
  }

  for (const reference of references) {
    if (!reference.id || !files.has(reference.id)) {
      issues.push({ code: "missing-file", severity: "error", message: `fptr points at unknown file ${reference.id || "(empty)"}`, line: reference.line })
    }
  }

  if (local(root) !== "mets") {
    issues.push({ code: "bad-root", severity: "error", message: `Root must be mets, found ${root || "nothing"}` })
  }
  if (structMaps === 0) issues.push({ code: "no-struct-map", severity: "error", message: "Document has no structMap" })
  if (files.size === 0) issues.push({ code: "no-files", severity: "error", message: "fileSec has no file" })
  if (headers === 0) issues.push({ code: "no-header", severity: "warning", message: "Document has no metsHdr" })

  return {
    format: "METS",
    records,
    meta: { headers, dmdSections, fileGroups, files: files.size, structMaps, divs, references: references.length },
    issues,
  }
}

const reference = [
  "METS digital object (XML)",
  "",
  '<mets xmlns="http://www.loc.gov/METS/">',
  '  <metsHdr CREATEDATE="2026-11-13T10:00:00Z"/>',
  '  <fileSec><fileGrp USE="images"><file ID="F1" HREF="page1.tif"/></fileGrp></fileSec>',
  '  <structMap><div><fptr FILEID="F1"/></div></structMap>',
  "</mets>",
  "",
  "Root is mets.",
  "fileSec lists files with unique IDs.",
  "Every fptr FILEID must match a declared file.",
].join("\n")

export const format: FormatModule = {
  slug: "mets",
  displayName: "METS",
  extensions: [".xml", ".mets"],
  description: "Parse METS documents, validate files, structMap and file references.",
  reference,
  parse,
  sample: () =>
    [
      '<?xml version="1.0"?>',
      '<mets xmlns="http://www.loc.gov/METS/">',
      '  <metsHdr CREATEDATE="2026-11-13T10:00:00Z"/>',
      '  <fileSec><fileGrp USE="images"><file ID="F1" HREF="page1.tif"/></fileGrp></fileSec>',
      '  <structMap><div><fptr FILEID="F1"/></div></structMap>',
      "</mets>",
    ].join("\n") + "\n",
}
