import type { FormatModule, Parsed, ParsedRecord } from "./types.js"
import { readRoot, scanTags, validateXml } from "./_xml.js"

const local = (name: string): string => (name.includes(":") ? name.slice(name.lastIndexOf(":") + 1) : name)
const numeric = (value: string | undefined): boolean => value !== undefined && Number.isFinite(Number(value))

function parse(text: string): Parsed {
  const issues: Parsed["issues"] = []
  const root = readRoot(text)
  validateXml(text, root, "ALTO document", issues)

  const tags = scanTags(text)
  const records: ParsedRecord[] = []
  let pages = 0
  let blocks = 0
  let lines = 0
  let strings = 0

  for (const tag of tags) {
    if (tag.close) continue
    const name = local(tag.name)
    if (name === "Page") {
      pages += 1
      for (const attr of ["WIDTH", "HEIGHT"]) {
        if (!numeric(tag.attrs[attr])) issues.push({ code: "page-size", severity: "error", message: `Page ${attr} must be numeric`, line: tag.line })
      }
      records.push({ id: `page:${pages}`, kind: "page", fields: { width: Number(tag.attrs.WIDTH ?? 0), height: Number(tag.attrs.HEIGHT ?? 0), line: tag.line } })
      continue
    }
    if (name === "TextBlock") {
      blocks += 1
      continue
    }
    if (name === "TextLine") {
      lines += 1
      continue
    }
    if (name === "String") {
      strings += 1
      const content = tag.attrs.CONTENT ?? ""
      if (!content) issues.push({ code: "no-content", severity: "error", message: "String has no CONTENT", line: tag.line })
      for (const attr of ["HPOS", "VPOS", "WIDTH", "HEIGHT"]) {
        if (tag.attrs[attr] !== undefined && !numeric(tag.attrs[attr])) {
          issues.push({ code: "bad-geometry", severity: "error", message: `String ${attr} must be numeric`, line: tag.line })
        }
      }
      records.push({ id: `string:${strings}`, kind: "string", fields: { content: content.slice(0, 200), hpos: Number(tag.attrs.HPOS ?? 0), line: tag.line } })
    }
  }

  if (local(root) !== "alto") issues.push({ code: "bad-root", severity: "error", message: `Root must be alto, found ${root || "nothing"}` })
  if (pages === 0) issues.push({ code: "no-pages", severity: "error", message: "Document has no Page" })
  if (strings === 0) issues.push({ code: "no-strings", severity: "error", message: "Document has no String" })

  return { format: "ALTO", records, meta: { pages, blocks, lines, strings }, issues }
}

const reference = [
  "ALTO OCR layout",
  "",
  '<alto xmlns="http://www.loc.gov/standards/alto/ns-v4#">',
  "  <Layout>",
  '    <Page WIDTH="2480" HEIGHT="3508">',
  "      <PrintSpace>",
  "        <TextBlock>",
  "          <TextLine>",
  '            <String CONTENT="Hello" HPOS="100" VPOS="120" WIDTH="200" HEIGHT="40"/>',
  "          </TextLine>",
  "        </TextBlock>",
  "      </PrintSpace>",
  "    </Page>",
  "  </Layout>",
  "</alto>",
  "",
  "Every Page needs numeric WIDTH and HEIGHT.",
  "Every String needs CONTENT and optional numeric geometry.",
].join("\n")

export const format: FormatModule = {
  slug: "alto",
  displayName: "ALTO",
  extensions: [".xml"],
  description: "Parse ALTO OCR layouts, validate pages, text blocks and recognised strings.",
  reference,
  parse,
  sample: () =>
    [
      '<?xml version="1.0"?>',
      '<alto xmlns="http://www.loc.gov/standards/alto/ns-v4#">',
      "  <Layout>",
      '    <Page WIDTH="2480" HEIGHT="3508">',
      "      <PrintSpace>",
      "        <TextBlock>",
      "          <TextLine>",
      '            <String CONTENT="Hello" HPOS="100" VPOS="120" WIDTH="200" HEIGHT="40"/>',
      '            <String CONTENT="world" HPOS="320" VPOS="120" WIDTH="220" HEIGHT="40"/>',
      "          </TextLine>",
      "        </TextBlock>",
      "      </PrintSpace>",
      "    </Page>",
      "  </Layout>",
      "</alto>",
    ].join("\n") + "\n",
}
