import type { FormatModule, Issue, Parsed, ParsedRecord } from "./types.js"

export interface XmlTag {
  name: string
  attrs: Record<string, string>
  close: boolean
  selfClose: boolean
  line: number
}

export function scanTags(text: string): XmlTag[] {
  const tags: XmlTag[] = []
  const re = /<(\/?)([A-Za-z_][\w.:-]*)([^>]*?)(\/?)>/g
  let match: RegExpExecArray | null
  let cursor = 0
  let line = 1
  while ((match = re.exec(text)) !== null) {
    line += (text.slice(cursor, match.index).match(/\n/g) ?? []).length
    cursor = match.index
    const attrs: Record<string, string> = {}
    for (const attr of match[3].matchAll(/([\w.:-]+)\s*=\s*"([^"]*)"/g)) attrs[attr[1]] = attr[2]
    tags.push({ name: match[2], attrs, close: match[1] === "/", selfClose: match[4] === "/", line })
  }
  return tags
}

export function readRoot(text: string): string {
  const declaration = text.replace(/^\s*<\?xml[^>]*\?>/, "")
  const match = /<\s*([A-Za-z_][\w.:-]*)/.exec(declaration)
  return match ? match[1] : ""
}

export function validateXml(text: string, root: string, displayName: string, issues: Issue[]): void {
  if (text.trim().length === 0) {
    issues.push({ code: "empty", severity: "error", message: "Document is empty" })
    return
  }
  const tags = scanTags(text)
  if (tags.length === 0) {
    issues.push({ code: "no-tags", severity: "error", message: "No XML elements found" })
    return
  }
  const found = readRoot(text)
  if (found !== root) {
    issues.push({ code: "bad-root", severity: "error", message: `Root element must be ${root}, found ${found || "nothing"}` })
  }
  const stack: XmlTag[] = []
  for (const tag of tags) {
    if (tag.selfClose) continue
    if (tag.close) {
      const open = stack.pop()
      if (!open) {
        issues.push({ code: "unmatched-close", severity: "error", message: `Closing </${tag.name}> has no opening tag`, line: tag.line })
      } else if (open.name !== tag.name) {
        issues.push({
          code: "mismatched-tag",
          severity: "error",
          message: `</${tag.name}> closes <${open.name}> from line ${open.line}`,
          line: tag.line,
        })
      }
      continue
    }
    stack.push(tag)
  }
  for (const open of stack.slice(-3)) {
    issues.push({ code: "unclosed-tag", severity: "error", message: `<${open.name}> is never closed`, line: open.line })
  }
  if (!root) issues.push({ code: "no-root", severity: "error", message: `${displayName} has no root element` })
}
