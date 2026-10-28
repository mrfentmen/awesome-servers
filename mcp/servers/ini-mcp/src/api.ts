/**
 * INI Files — keyless public API client.
 */

export class SourceError extends Error {}

export function section(title: string, rows: string[]): string {
  return [title, ...rows.filter(Boolean)].join("\n")
}

type Entry = { kind: "pair"; key: string; value: string } | { kind: "section"; name: string } | { kind: "comment"; text: string }

function stripInlineComment(value: string): string {
  let inQuote: string | null = null
  for (let i = 0; i < value.length; i++) {
    const ch = value[i]
    if (inQuote) {
      if (ch === inQuote) inQuote = null
      continue
    }
    if (ch === '"' || ch === "'") {
      inQuote = ch
      continue
    }
    if ((ch === ";" || ch === "#") && (i === 0 || /\s/.test(value[i - 1]))) {
      return value.slice(0, i).trimEnd()
    }
  }
  return value.trimEnd()
}

function unquote(value: string): string {
  const trimmed = value.trim()
  if (trimmed.length >= 2 && ((trimmed.startsWith('"') && trimmed.endsWith('"')) || (trimmed.startsWith("'") && trimmed.endsWith("'")))) {
    return trimmed.slice(1, -1)
  }
  return trimmed
}

type ParseResult = { entries: Entry[]; errors: string[] }

function parseIni(text: string): ParseResult {
  const entries: Entry[] = []
  const errors: string[] = []
  const lines = text.replace(/\r\n/g, "\n").split("\n")
  lines.forEach((raw, index) => {
    const lineNo = index + 1
    const line = raw.trim()
    if (!line) return
    if (line.startsWith(";") || line.startsWith("#")) {
      entries.push({ kind: "comment", text: line })
      return
    }
    if (line.startsWith("[")) {
      if (!line.endsWith("]")) {
        errors.push(`line ${lineNo}: section header is missing its closing bracket`)
        return
      }
      const name = line.slice(1, -1).trim()
      if (!name) errors.push(`line ${lineNo}: section name is empty`)
      entries.push({ kind: "section", name })
      return
    }
    const eq = line.indexOf("=")
    if (eq < 0) {
      const colon = line.indexOf(":")
      if (colon > 0) {
        const key = line.slice(0, colon).trim()
        const value = stripInlineComment(line.slice(colon + 1))
        entries.push({ kind: "pair", key, value: unquote(value) })
        return
      }
      errors.push(`line ${lineNo}: not a key=value pair: "${line.slice(0, 40)}"`)
      return
    }
    const key = line.slice(0, eq).trim()
    if (!key) {
      errors.push(`line ${lineNo}: the key before "=" is empty`)
      return
    }
    const value = stripInlineComment(line.slice(eq + 1))
    if (unquote(value).length === 0 && value.trim() !== "" && !/^["']{2}$/.test(value.trim())) {
      errors.push(`line ${lineNo}: the value has an unterminated quote`)
    }
    entries.push({ kind: "pair", key, value: unquote(value) })
  })
  return { entries, errors }
}

function group(entries: Entry[]): Array<{ name: string; pairs: Array<{ key: string; value: string }> }> {
  const sections: Array<{ name: string; pairs: Array<{ key: string; value: string }> }> = []
  let current = { name: "", pairs: [] as Array<{ key: string; value: string }> }
  sections.push(current)
  for (const entry of entries) {
    if (entry.kind === "section") {
      current = { name: entry.name, pairs: [] }
      sections.push(current)
    } else if (entry.kind === "pair") {
      current.pairs.push({ key: entry.key, value: entry.value })
    }
  }
  return sections.filter((s) => s.name || s.pairs.length)
}

export async function parseIniFile(a: { text: string }): Promise<string> {
  const { entries, errors } = parseIni(a.text)
  const sections = group(entries)
  if (!entries.length) throw new SourceError("no ini content found")
  const lines: string[] = []
  for (const section of sections) {
    lines.push(section.name ? `[${section.name}]` : "(top level, no section)")
    for (const pair of section.pairs) lines.push(`  ${pair.key} = ${pair.value}`)
    lines.push("")
  }
  return [
    `${sections.length} section(s), ${entries.filter((e) => e.kind === "pair").length} key(s):`,
    "",
    ...lines,
    ...(errors.length ? ["Problems:", ...errors.map((e) => `- ${e}`)] : []),
  ].join("\n").trimEnd()
}

export async function iniToJson(a: { text: string; mergeDuplicateSections?: boolean }): Promise<string> {
  const { entries, errors } = parseIni(a.text)
  if (errors.length) throw new SourceError(`the ini text has problems: ${errors.join("; ")}`)
  const sections = group(entries)
  const out: Record<string, Record<string, string>> = {}
  for (const section of sections) {
    const name = section.name || "default"
    for (const pair of section.pairs) {
      out[name] = out[name] ?? {}
      if (pair.key in out[name] && !a.mergeDuplicateSections) {
        throw new SourceError(`key "${pair.key}" appears twice in section "${name}"`)
      }
      out[name][pair.key] = pair.value
    }
  }
  return [
    "Parsed ini as JSON:",
    "",
    JSON.stringify(out, null, 2),
  ].join("\n")
}

export async function createIni(a: { json: string }): Promise<string> {
  let data: any
  try {
    data = JSON.parse(a.json)
  } catch (e) {
    throw new SourceError(`json is not valid: ${(e as Error).message}`)
  }
  if (data === null || typeof data !== "object" || Array.isArray(data)) {
    throw new SourceError("json must be an object of key/value pairs and nested objects")
  }
  const scalars = (value: any) => value === null || ["string", "number", "boolean"].includes(typeof value)
  const lines: string[] = []
  const render = (value: any): string => (value === null ? "" : String(value))
  for (const [key, value] of Object.entries(data)) {
    if (scalars(value)) lines.push(`${key} = ${render(value)}`)
  }
  for (const [section, value] of Object.entries(data)) {
    if (scalars(value)) continue
    if (Array.isArray(value)) {
      lines.push("", `[${section}]`, `values = ${value.map(render).join(",")}`)
      continue
    }
    if (value !== null && typeof value === "object") {
      lines.push("", `[${section}]`)
      for (const [key, inner] of Object.entries(value as Record<string, any>)) {
        if (inner !== null && typeof inner === "object") throw new SourceError(`section "${section}" key "${key}" nests too deeply for an ini file`)
        lines.push(`${key} = ${render(inner)}`)
      }
    }
  }
  if (!lines.length) throw new SourceError("json has no values to write")
  return [`Generated ini (${lines.length} line(s)):`, "", lines.join("\n")].join("\n")
}

export async function validateIni(a: { text: string }): Promise<string> {
  const { entries, errors } = parseIni(a.text)
  const problems = [...errors]
  const seenSections = new Set<string>()
  let current = ""
  const seenKeys = new Set<string>()
  for (const entry of entries) {
    if (entry.kind === "section") {
      if (seenSections.has(entry.name)) problems.push(`section [${entry.name}] is defined more than once`)
      seenSections.add(entry.name)
      current = entry.name
      seenKeys.clear()
    } else if (entry.kind === "pair") {
      const id = `${current}\u0000${entry.key}`
      if (seenKeys.has(entry.key)) problems.push(`key "${entry.key}" appears twice${current ? ` in [${current}]` : " at the top level"}`)
      seenKeys.add(entry.key)
      void id
    }
  }
  return [
    problems.length ? `Invalid ini — ${problems.length} problem(s):` : "Valid ini.",
    "",
    ...problems.map((p) => `- ${p}`),
  ].join("\n").trimEnd()
}
