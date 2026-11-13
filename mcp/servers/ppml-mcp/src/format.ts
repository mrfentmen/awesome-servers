import type { FormatModule, Parsed, ParsedRecord } from "./types.js"
import { readRoot, scanTags, validateXml } from "./_xml.js"

const local = (name: string): string => (name.includes(":") ? name.slice(name.lastIndexOf(":") + 1) : name)

function parse(text: string): Parsed {
  const issues: Parsed["issues"] = []
  const root = readRoot(text)
  validateXml(text, root, "PPML document", issues)

  const tags = scanTags(text)
  const records: ParsedRecord[] = []
  let jobs = 0
  let documents = 0
  let pages = 0
  let marks = 0
  let contents = 0

  for (const tag of tags) {
    if (tag.close) continue
    const name = local(tag.name)
    if (name === "Job") {
      jobs += 1
      records.push({ id: `job:${tag.attrs.JobID ?? jobs}`, kind: "job", fields: { jobId: tag.attrs.JobID ?? "", line: tag.line } })
      continue
    }
    if (name === "Document") {
      documents += 1
      records.push({ id: `document:${documents}`, kind: "document", fields: { line: tag.line } })
      continue
    }
    if (name === "Page") {
      pages += 1
      records.push({ id: `page:${pages}`, kind: "page", fields: { line: tag.line } })
      continue
    }
    if (name === "Content") {
      contents += 1
      continue
    }
    if (name === "Mark") {
      marks += 1
      records.push({ id: `mark:${marks}`, kind: "mark", fields: { line: tag.line } })
    }
  }

  if (local(root) !== "PPML") {
    issues.push({ code: "bad-root", severity: "error", message: `Root must be PPML, found ${root || "nothing"}` })
  }
  if (jobs === 0) issues.push({ code: "no-jobs", severity: "error", message: "Document has no Job" })
  if (pages === 0) issues.push({ code: "no-pages", severity: "error", message: "Document has no Page" })
  if (contents === 0) issues.push({ code: "no-content", severity: "warning", message: "No Content block found" })

  return {
    format: "PPML",
    records,
    meta: { jobs, documents, pages, contents, marks },
    issues,
  }
}

const reference = [
  "PPML personalized print job (XML)",
  "",
  "<PPML>",
  '  <Job JobID="J1">',
  "    <Document>",
  "      <Page>",
  "        <Content><Mark>Hello</Mark></Content>",
  "      </Page>",
  "    </Document>",
  "  </Job>",
  "</PPML>",
  "",
  "Root is PPML.",
  "A Job holds Documents, Documents hold Pages.",
  "Marks carry the printable content.",
].join("\n")

export const format: FormatModule = {
  slug: "ppml",
  displayName: "PPML",
  extensions: [".ppml", ".xml"],
  description: "Parse PPML print jobs, validate jobs, documents and pages.",
  reference,
  parse,
  sample: () =>
    [
      '<?xml version="1.0"?>',
      "<PPML>",
      '  <Job JobID="J1">',
      "    <Document>",
      "      <Page>",
      "        <Content><Mark>Hello</Mark></Content>",
      "      </Page>",
      "    </Document>",
      "  </Job>",
      "</PPML>",
    ].join("\n") + "\n",
}
