/**
 * XML Tools — keyless public API client.
 */

export class SourceError extends Error {}

export function section(title: string, rows: string[]): string {
  return [title, ...rows.filter(Boolean)].join("\n")
}

type XmlNode = { tag: string; attrs: Array<[string, string]>; children: XmlNode[]; text: string; line: number }

const ENTITIES: Record<string, string> = { amp: "&", lt: "<", gt: ">", quot: '"', apos: "'" }

function decodeEntities(raw: string): { text: string; errors: string[] } {
  const errors: string[] = []
  const text = raw.replace(/&(#x?[0-9A-Fa-f]+|[A-Za-z]+);/g, (whole, body: string) => {
    if (body.startsWith("#")) {
      const code = body.startsWith("#x") || body.startsWith("#X") ? parseInt(body.slice(2), 16) : parseInt(body.slice(1), 10)
      if (!Number.isFinite(code) || code < 0 || code > 0x10ffff) {
        errors.push(`invalid character reference ${whole}`)
        return whole
      }
      return String.fromCodePoint(code)
    }
    if (body in ENTITIES) return ENTITIES[body]
    errors.push(`unknown entity ${whole}`)
    return whole
  })
  return { text, errors }
}

function lineOf(text: string, index: number): number {
  let line = 1
  for (let i = 0; i < index && i < text.length; i++) if (text[i] === "\n") line++
  return line
}

type ParseResult = { roots: XmlNode[]; errors: string[]; elements: number; attributes: number }

function parseXml(text: string): ParseResult {
  const errors: string[] = []
  const roots: XmlNode[] = []
  const stack: XmlNode[] = []
  let elements = 0
  let attributes = 0
  let i = 0
  while (i < text.length) {
    const lt = text.indexOf("<", i)
    const chunk = lt < 0 ? text.slice(i) : text.slice(i, lt)
    if (chunk.trim()) {
      const { text: decoded, errors: entityErrors } = decodeEntities(chunk)
      errors.push(...entityErrors)
      if (!stack.length) {
        if (decoded.trim()) errors.push(`text outside any element at line ${lineOf(text, i)}: "${decoded.trim().slice(0, 30)}"`)
      } else {
        stack[stack.length - 1].text += decoded
      }
    }
    if (lt < 0) break
    i = lt
    const line = lineOf(text, i)
    if (text.startsWith("<?", i)) {
      const end = text.indexOf("?>", i)
      if (end < 0) {
        errors.push(`unterminated processing instruction at line ${line}`)
        break
      }
      i = end + 2
      continue
    }
    if (text.startsWith("<!--", i)) {
      const end = text.indexOf("-->", i)
      if (end < 0) {
        errors.push(`unterminated comment at line ${line}`)
        break
      }
      i = end + 3
      continue
    }
    if (text.startsWith("<![CDATA[", i)) {
      const end = text.indexOf("]]>", i)
      if (end < 0) {
        errors.push(`unterminated CDATA section at line ${line}`)
        break
      }
      if (stack.length) stack[stack.length - 1].text += text.slice(i + 9, end)
      else errors.push(`CDATA outside any element at line ${line}`)
      i = end + 3
      continue
    }
    if (text.startsWith("<!", i)) {
      // DOCTYPE and friends: skip to the closing angle bracket, minding a subset.
      let depthBracket = 0
      let j = i + 2
      while (j < text.length) {
        if (text[j] === "[") depthBracket++
        else if (text[j] === "]") depthBracket--
        else if (text[j] === ">" && depthBracket <= 0) break
        j++
      }
      if (j >= text.length) {
        errors.push(`unterminated declaration at line ${line}`)
        break
      }
      i = j + 1
      continue
    }
    if (text.startsWith("</", i)) {
      const end = text.indexOf(">", i)
      if (end < 0) {
        errors.push(`unterminated closing tag at line ${line}`)
        break
      }
      const tag = text.slice(i + 2, end).trim().split(/\s/)[0]
      const open = stack.pop()
      if (!open) errors.push(`closing tag </${tag}> at line ${line} has no matching opening tag`)
      else if (open.tag !== tag) errors.push(`</${tag}> at line ${line} closes <${open.tag}> opened at line ${open.line}`)
      i = end + 1
      continue
    }
    // opening tag: <name attr="v" ...> or <name .../>
    let j = i + 1
    let quote: string | null = null
    while (j < text.length) {
      const ch = text[j]
      if (quote) {
        if (ch === quote) quote = null
      } else if (ch === '"' || ch === "'") {
        quote = ch
      } else if (ch === ">") {
        break
      }
      j++
    }
    if (j >= text.length) {
      errors.push(`unterminated opening tag at line ${line}`)
      break
    }
    const inner = text.slice(i + 1, j)
    const selfClosing = inner.endsWith("/")
    const body = selfClosing ? inner.slice(0, -1) : inner
    const nameMatch = /^([A-Za-z_:][-A-Za-z0-9_:.]*)/.exec(body.trim())
    if (!nameMatch) {
      errors.push(`malformed tag at line ${line}: "<${inner.slice(0, 30)}>"`)
      i = j + 1
      continue
    }
    const tag = nameMatch[1]
    const attrs: Array<[string, string]> = []
    let rest = body.trim().slice(tag.length)
    while (rest.trim()) {
      const attrMatch = /^\s*([A-Za-z_:][-A-Za-z0-9_:.]*)\s*=\s*("([^"]*)"|'([^']*)')/.exec(rest)
      if (!attrMatch) {
        const bareMatch = /^\s*([A-Za-z_:][-A-Za-z0-9_:.]*)\s*(?=\s|$)/.exec(rest)
        if (bareMatch) {
          errors.push(`attribute "${bareMatch[1]}" on <${tag}> at line ${line} has no value`)
          rest = rest.slice(bareMatch[0].length)
          continue
        }
        errors.push(`cannot read attributes of <${tag}> at line ${line}: "${rest.trim().slice(0, 30)}"`)
        break
      }
      const value = attrMatch[3] !== undefined ? attrMatch[3] : attrMatch[4]
      const { text: decoded, errors: entityErrors } = decodeEntities(value ?? "")
      errors.push(...entityErrors)
      attrs.push([attrMatch[1], decoded])
      attributes++
      rest = rest.slice(attrMatch[0].length)
    }
    const node: XmlNode = { tag, attrs, children: [], text: "", line }
    elements++
    if (stack.length) stack[stack.length - 1].children.push(node)
    else roots.push(node)
    if (!selfClosing) stack.push(node)
    i = j + 1
  }
  for (const open of stack) errors.push(`<${open.tag}> opened at line ${open.line} is never closed`)
  return { roots, errors, elements, attributes }
}

function renderTree(node: XmlNode, depth: number, lines: string[]): void {
  const attrText = node.attrs.map(([k, v]) => `${k}="${v}"`).join(" ")
  const trimmed = node.text.trim()
  lines.push(`${"  ".repeat(depth)}<${node.tag}${attrText ? " " + attrText : ""}>${node.children.length ? "" : trimmed ? ` ${trimmed.slice(0, 60)}${trimmed.length > 60 ? "..." : ""}` : ""}`)
  for (const child of node.children) renderTree(child, depth + 1, lines)
}

function toJson(node: XmlNode): any {
  // A leaf that is only text becomes a plain string; anything else stays an object.
  if (!node.attrs.length && !node.children.length) return node.text.trim()
  const out: Record<string, any> = {}
  for (const [key, value] of node.attrs) out[`@${key}`] = value
  const groups = new Map<string, XmlNode[]>()
  for (const child of node.children) {
    const list = groups.get(child.tag) ?? []
    list.push(child)
    groups.set(child.tag, list)
  }
  for (const [tag, list] of groups) out[tag] = list.length === 1 ? toJson(list[0]) : list.map(toJson)
  const text = node.text.trim()
  if (text) out["#text"] = text
  return out
}

export async function parseXmlFile(a: { text: string }): Promise<string> {
  const result = parseXml(a.text)
  if (result.errors.length) {
    throw new SourceError(`the XML is not well-formed:\n${result.errors.slice(0, 5).map((e) => `- ${e}`).join("\n")}`)
  }
  if (!result.roots.length) throw new SourceError("the document has no elements")
  const lines: string[] = []
  for (const root of result.roots) renderTree(root, 0, lines)
  return [
    `${result.elements} element(s), ${result.attributes} attribute(s), ${result.roots.length} root element(s):`,
    "",
    ...lines.slice(0, 200),
    lines.length > 200 ? `... ${lines.length - 200} more line(s)` : "",
  ]
    .filter(Boolean)
    .join("\n")
}

export async function xmlToJson(a: { text: string }): Promise<string> {
  const result = parseXml(a.text)
  if (result.errors.length) throw new SourceError(`the XML is not well-formed: ${result.errors[0]}`)
  if (result.roots.length !== 1) throw new SourceError(`expected exactly one root element, found ${result.roots.length}`)
  const json = JSON.stringify({ [result.roots[0].tag]: toJson(result.roots[0]) }, null, 2)
  return [
    "Converted XML to JSON (attributes use @, text uses #text):",
    "",
    json.length > 6000 ? json.slice(0, 6000) + "\n... (truncated at 6000 characters)" : json,
  ].join("\n")
}

export async function validateXml(a: { text: string }): Promise<string> {
  const result = parseXml(a.text)
  const notes: string[] = []
  if (result.roots.length > 1) result.errors.push(`the document has ${result.roots.length} root elements; XML allows exactly one`)
  const declaration = /^\s*<\?xml\s+version=/i.test(a.text)
  notes.push(declaration ? "has an XML declaration" : "no XML declaration (fine for a fragment)")
  return [
    result.errors.length ? `Not well-formed — ${result.errors.length} problem(s):` : "Well-formed XML.",
    "",
    ...result.errors.map((e) => `- ${e}`),
    ...(result.errors.length ? [] : ["", "Notes:", ...notes.map((n) => `- ${n}`), `- ${result.elements} element(s), ${result.attributes} attribute(s)`]),
  ]
    .filter((line, index, all) => line !== "" || all[index - 1] !== "")
    .join("\n")
}
