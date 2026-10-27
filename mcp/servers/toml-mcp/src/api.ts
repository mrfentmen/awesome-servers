/**
 * TOML Tools — keyless public API client.
 */
const BASE = ""
const SOURCE = "TOML Tools"

export class SourceError extends Error {}

async function request(path: string, accept = "application/json", timeoutMs = 25000): Promise<Response> {
  const ctrl = new AbortController()
  const timer = setTimeout(() => ctrl.abort(), timeoutMs)
  try {
    const res = await fetch(path.startsWith("http") ? path : BASE + path, {
      signal: ctrl.signal,
      headers: { "user-agent": "toml-mcp", accept },
    })
    if (!res.ok) throw new SourceError(`${SOURCE} responded ${res.status}`)
    return res
  } catch (e) {
    if (e instanceof SourceError) throw e
    if ((e as Error).name === "AbortError") throw new SourceError(`${SOURCE} request timed out`)
    throw new SourceError(`${SOURCE} request failed: ${(e as Error).message}`)
  } finally {
    clearTimeout(timer)
  }
}

export async function getJson(path: string): Promise<any> {
  const res = await request(path)
  const body = await res.text()
  try {
    return JSON.parse(body)
  } catch {
    throw new SourceError(`${SOURCE} returned malformed JSON`)
  }
}

export async function getText(path: string, accept = "text/plain"): Promise<string> {
  const res = await request(path, accept)
  return (await res.text()).trim()
}

export function clampLimit(n: number | undefined, fallback: number, max: number): number {
  const v = n ?? fallback
  if (!Number.isInteger(v) || v < 1 || v > max) throw new SourceError(`limit must be between 1 and ${max}`)
  return v
}

export function clean(s: unknown): string {
  return String(s ?? "").replace(/\s+/g, " ").trim()
}

export function bullet(label: string, value: unknown): string {
  const v = value === undefined || value === null || value === "" ? "" : String(value)
  return v ? `${label}: ${v}` : ""
}

export function section(title: string, rows: string[]): string {
  return [title, ...rows.filter(Boolean)].join("\n")
}

/**
 * Minimal but real TOML 1.0 reader and writer: scalars, dotted keys, tables,
 * arrays of tables, multiline strings, dates and times (kept as strings).
 */

function lineColumn(source: string, at: number): string {
  let line = 1
  let col = 1
  for (let k = 0; k < at && k < source.length; k += 1) {
    if (source[k] === "\n") {
      line += 1
      col = 1
    } else col += 1
  }
  return `line ${line}, column ${col}`
}

function tomlFail(source: string, at: number, message: string): never {
  throw new SourceError(`TOML error at ${lineColumn(source, at)}: ${message}`)
}

const KEY_ISH = /[A-Za-z0-9_-]/

function stripUnderscores(token: string, source: string, at: number): string {
  if (token.startsWith("_") || token.endsWith("_") || token.includes("__")) tomlFail(source, at, `malformed number ${token}`)
  return token.replace(/_/g, "")
}

function parseInteger(token: string, source: string, at: number): number {
  const sign = token.startsWith("-") ? "-" : ""
  const body = token.replace(/^[+-]/, "")
  const cleaned = stripUnderscores(body, source, at)
  let value: bigint
  if (/^0x[0-9a-fA-F]+$/.test(cleaned)) value = BigInt(cleaned)
  else if (/^0o[0-7]+$/.test(cleaned)) value = BigInt(cleaned)
  else if (/^0b[01]+$/.test(cleaned)) value = BigInt(cleaned)
  else if (/^(0|[1-9][0-9]*)$/.test(cleaned)) value = BigInt(cleaned)
  else tomlFail(source, at, `malformed integer ${token}`)
  const signed = sign === "-" ? -value : value
  if (signed > 9007199254740991n || signed < -9007199254740991n) tomlFail(source, at, `integer ${token} is outside the safe JavaScript range`)
  return Number(signed)
}

function parseFloatToken(token: string, source: string, at: number): number {
  const body = token.replace(/^[+-]/, "")
  const cleaned = stripUnderscores(body, source, at)
  const mantissa = cleaned.split(/[eE]/)[0]
  if (/\./.test(mantissa) && !/^\d+\.\d+$/.test(mantissa)) tomlFail(source, at, `malformed float ${token}`)
  if (!/\./.test(mantissa) && !/[eE]/.test(cleaned)) tomlFail(source, at, `malformed float ${token}`)
  const value = Number(cleaned)
  if (!Number.isFinite(value)) tomlFail(source, at, `float ${token} is out of range`)
  return token.startsWith("-") ? -value : value
}

function checkDate(raw: string, source: string, at: number): void {
  const parts = /^(\d{4})-(\d{2})-(\d{2})(.*)$/.exec(raw)
  if (!parts) return
  const month = Number(parts[2])
  const day = Number(parts[3])
  if (month < 1 || month > 12) tomlFail(source, at, `month ${parts[2]} is out of range`)
  if (day < 1 || day > 31) tomlFail(source, at, `day ${parts[3]} is out of range`)
  const rest = parts[4]
  if (!rest) return
  const time = /^[Tt ](\d{2}):(\d{2}):(\d{2})/.exec(rest)
  if (!time) tomlFail(source, at, `malformed date-time ${raw}`)
  const hour = Number(time[1])
  const minute = Number(time[2])
  const second = Number(time[3])
  if (hour > 23) tomlFail(source, at, `hour ${time[1]} is out of range`)
  if (minute > 59) tomlFail(source, at, `minute ${time[2]} is out of range`)
  if (second > 60) tomlFail(source, at, `second ${time[3]} is out of range`)
}

class TomlReader {
  private readonly s: string
  private i = 0

  constructor(source: string) {
    this.s = source
  }

  private at(offset = 0): string {
    return this.s[this.i + offset] ?? ""
  }

  private eof(): boolean {
    return this.i >= this.s.length
  }

  private fail(message: string): never {
    tomlFail(this.s, this.i, message)
  }

  private skipSpaces(): void {
    while (!this.eof() && (this.at() === " " || this.at() === "\t")) this.i += 1
  }

  private skipTrivia(allowNewline: boolean): void {
    for (;;) {
      this.skipSpaces()
      if (this.at() === "#") {
        while (!this.eof() && this.at() !== "\n") this.i += 1
        continue
      }
      if (allowNewline && this.at() === "\r" && this.at(1) === "\n") {
        this.i += 2
        continue
      }
      if (allowNewline && this.at() === "\n") {
        this.i += 1
        continue
      }
      return
    }
  }

  private endOfLine(context: string): void {
    this.skipSpaces()
    if (this.at() === "#") while (!this.eof() && this.at() !== "\n") this.i += 1
    if (this.eof()) return
    if (this.at() === "\r" && this.at(1) === "\n") {
      this.i += 2
      return
    }
    if (this.at() === "\n") {
      this.i += 1
      return
    }
    this.fail(`unexpected ${JSON.stringify(this.at())} after ${context}`)
  }

  private parseEscape(): string {
    const ch = this.at()
    this.i += 1
    const simple: Record<string, string> = { n: "\n", t: "\t", r: "\r", b: "\b", f: "\f", '"': '"', "\\": "\\" }
    if (simple[ch] !== undefined) return simple[ch]
    if (ch === "u" || ch === "U") {
      const width = ch === "u" ? 4 : 8
      const hex = this.s.slice(this.i, this.i + width)
      if (!new RegExp(`^[0-9a-fA-F]{${width}}$`).test(hex)) this.fail("invalid unicode escape")
      this.i += width
      const code = parseInt(hex, 16)
      if (code > 0x10ffff || (code >= 0xd800 && code <= 0xdfff)) this.fail("unicode escape is not a valid code point")
      return String.fromCodePoint(code)
    }
    this.fail(`unknown escape \\${ch}`)
  }

  private parseKey(): string {
    if (this.at() === '"' || this.at() === "'") {
      const quote = this.at()
      const triple = this.at(1) === quote && this.at(2) === quote
      if (triple) this.fail("multi-line strings cannot be used as keys")
      this.i += 1
      let out = ""
      for (;;) {
        if (this.eof() || this.at() === "\n") this.fail("unterminated quoted key")
        const ch = this.at()
        if (ch === quote) {
          this.i += 1
          return out
        }
        if (ch === "\\" && quote === '"') {
          this.i += 1
          out += this.parseEscape()
          continue
        }
        out += ch
        this.i += 1
      }
    }
    const start = this.i
    while (!this.eof() && KEY_ISH.test(this.at())) this.i += 1
    if (this.i === start) this.fail("expected a key")
    return this.s.slice(start, this.i)
  }

  private parseKeyPath(): string[] {
    const keys: string[] = []
    for (;;) {
      keys.push(this.parseKey())
      this.skipSpaces()
      if (this.at() === ".") {
        this.i += 1
        this.skipSpaces()
        continue
      }
      return keys
    }
  }

  private parseBasicString(): string {
    this.i += 1
    let out = ""
    for (;;) {
      if (this.eof() || this.at() === "\n") this.fail("unterminated string")
      const ch = this.at()
      if (ch === '"') {
        this.i += 1
        return out
      }
      if (ch === "\\") {
        this.i += 1
        out += this.parseEscape()
        continue
      }
      out += ch
      this.i += 1
    }
  }

  private parseLiteralString(): string {
    this.i += 1
    const start = this.i
    while (!this.eof() && this.at() !== "'") {
      if (this.at() === "\n") this.fail("unterminated literal string")
      this.i += 1
    }
    if (this.eof()) this.fail("unterminated literal string")
    const out = this.s.slice(start, this.i)
    this.i += 1
    return out
  }

  private parseMultiline(quote: string): string {
    this.i += 3
    if (this.at() === "\r" && this.at(1) === "\n") this.i += 2
    else if (this.at() === "\n") this.i += 1
    let out = ""
    for (;;) {
      if (this.eof()) this.fail("unterminated multi-line string")
      if (this.at() === quote && this.at(1) === quote && this.at(2) === quote) {
        this.i += 3
        while (this.at() === quote && this.i < this.s.length) {
          out += quote
          this.i += 1
        }
        return out
      }
      const ch = this.at()
      if (ch === "\\" && quote === '"') {
        const next = this.at(1)
        if (next === " " || next === "\t" || next === "\n" || next === "\r") {
          this.i += 1
          while (!this.eof() && /[ \t\r\n]/.test(this.at())) this.i += 1
          continue
        }
        this.i += 1
        out += this.parseEscape()
        continue
      }
      out += ch
      this.i += 1
    }
  }

  private parseArray(): unknown[] {
    this.i += 1
    const out: unknown[] = []
    for (;;) {
      this.skipTrivia(true)
      if (this.at() === "]") {
        this.i += 1
        return out
      }
      if (this.eof()) this.fail("unterminated array")
      out.push(this.parseValue())
      this.skipTrivia(true)
      if (this.at() === ",") {
        this.i += 1
        continue
      }
      if (this.at() === "]") {
        this.i += 1
        return out
      }
      this.fail("expected a comma or ] in array")
    }
  }

  private parseInlineTable(): Record<string, unknown> {
    this.i += 1
    const out: Record<string, unknown> = {}
    for (;;) {
      this.skipSpaces()
      if (this.at() === "}") {
        this.i += 1
        return out
      }
      if (this.eof()) this.fail("unterminated inline table")
      if (this.at() === "\n") this.fail("newlines are not allowed inside an inline table")
      const keys = this.parseKeyPath()
      this.skipSpaces()
      if (this.at() !== "=") this.fail("expected = inside inline table")
      this.i += 1
      this.skipSpaces()
      this.assign(out, keys, this.parseValue(), "inline table")
      this.skipSpaces()
      if (this.at() === ",") {
        this.i += 1
        continue
      }
      if (this.at() === "}") {
        this.i += 1
        return out
      }
      this.fail("expected a comma or } in inline table")
    }
  }

  private parseNumberOrDate(): unknown {
    const start = this.i
    while (!this.eof() && /[0-9A-Za-z_+\-.:]/.test(this.at())) this.i += 1
    const token = this.s.slice(start, this.i)
    if (!token) this.fail("expected a value")
    if (token === "inf" || token === "+inf") return Infinity
    if (token === "-inf") return -Infinity
    if (token === "nan" || token === "+nan" || token === "-nan") return NaN
    const dateTime = /^(\d{4})-(\d{2})-(\d{2})(?:[Tt ](\d{2}):(\d{2}):(\d{2})(\.\d+)?([Zz]|[+-]\d{2}:\d{2})?)?$/.exec(token)
    if (dateTime) {
      checkDate(token, this.s, start)
      if (dateTime[4] === undefined) return `${dateTime[1]}-${dateTime[2]}-${dateTime[3]}`
      const fraction = dateTime[7] ?? ""
      const offset = (dateTime[8] ?? "").replace(/[Zz]/, "+00:00")
      return `${dateTime[1]}-${dateTime[2]}-${dateTime[3]}T${dateTime[4]}:${dateTime[5]}:${dateTime[6]}${fraction}${offset}`
    }
    if (/^\d{2}:\d{2}:\d{2}(\.\d+)?$/.test(token)) {
      const hm = Number(token.slice(0, 2))
      const mm = Number(token.slice(3, 5))
      const ss = Number(token.slice(6, 8))
      if (hm > 23 || mm > 59 || ss > 60) tomlFail(this.s, start, `time ${token} is out of range`)
      return token
    }
    if (/^[+-]?(0x|0o|0b)/.test(token)) return parseInteger(token, this.s, start)
    if (/^[+-]?\d/.test(token)) {
      if (/[.eE]/.test(token.replace(/^[+-]/, "").split("_").join(""))) return parseFloatToken(token, this.s, start)
      return parseInteger(token, this.s, start)
    }
    this.fail(`cannot read the value ${token}`)
  }

  private parseValue(): unknown {
    const ch = this.at()
    if (ch === '"') {
      if (this.at(1) === '"' && this.at(2) === '"') return this.parseMultiline('"')
      return this.parseBasicString()
    }
    if (ch === "'") {
      if (this.at(1) === "'" && this.at(2) === "'") return this.parseMultiline("'")
      return this.parseLiteralString()
    }
    if (ch === "[") return this.parseArray()
    if (ch === "{") return this.parseInlineTable()
    if (this.s.startsWith("true", this.i) && !KEY_ISH.test(this.at(4))) {
      this.i += 4
      return true
    }
    if (this.s.startsWith("false", this.i) && !KEY_ISH.test(this.at(5))) {
      this.i += 5
      return false
    }
    return this.parseNumberOrDate()
  }

  private assign(target: Record<string, unknown>, keys: string[], value: unknown, where: string): void {
    let node = target
    for (let k = 0; k < keys.length - 1; k += 1) {
      const key = keys[k]
      const next = node[key]
      if (next === undefined) {
        const created: Record<string, unknown> = {}
        node[key] = created
        node = created
        continue
      }
      if (Array.isArray(next)) {
        const last = next[next.length - 1]
        if (last === null || typeof last !== "object" || Array.isArray(last)) this.fail(`cannot extend the array at ${keys.slice(0, k + 1).join(".")}`)
        node = last as Record<string, unknown>
        continue
      }
      if (typeof next !== "object" || next === null) this.fail(`the key ${keys.slice(0, k + 1).join(".")} is already a value`)
      node = next as Record<string, unknown>
    }
    const last = keys[keys.length - 1]
    if (node[last] !== undefined) this.fail(`duplicate key ${keys.join(".")} in ${where}`)
    node[last] = value
  }

  private step(node: Record<string, unknown>, key: string, fullPath: string): Record<string, unknown> {
    const next = node[key]
    if (next === undefined) {
      const created: Record<string, unknown> = {}
      node[key] = created
      return created
    }
    if (Array.isArray(next)) {
      const last = next[next.length - 1]
      if (last === null || typeof last !== "object" || Array.isArray(last)) this.fail(`cannot use ${fullPath} as a table`)
      return last as Record<string, unknown>
    }
    if (typeof next !== "object" || next === null) this.fail(`the key ${fullPath} is already a value, not a table`)
    return next as Record<string, unknown>
  }

  private tableAt(keys: string[], array: boolean): Record<string, unknown> {
    const full = keys.join(".")
    if (array) {
      if (this.assignedKeys.has(full)) this.fail(`[[${full}]] was already given a value with dotted keys`)
    } else {
      if (this.declaredTables.has(full) || this.arrayTables.has(full)) this.fail(`the table ${full} is defined twice`)
      if (this.assignedKeys.has(full)) this.fail(`the table ${full} was already given a value with dotted keys`)
    }
    let node = this.root
    for (let i = 0; i < keys.length - 1; i += 1) node = this.step(node, keys[i], keys.slice(0, i + 1).join("."))
    const last = keys[keys.length - 1]
    const existing = node[last]
    if (array) {
      if (existing === undefined) {
        const fresh: Record<string, unknown> = {}
        node[last] = [fresh]
        this.arrayTables.add(full)
        return fresh
      }
      if (!Array.isArray(existing)) this.fail(`[[${full}]] conflicts with the table ${full} that was already defined`)
      const fresh: Record<string, unknown> = {}
      existing.push(fresh)
      return fresh
    }
    if (existing === undefined) {
      const fresh: Record<string, unknown> = {}
      node[last] = fresh
      this.declaredTables.add(full)
      return fresh
    }
    this.declaredTables.add(full)
    return existing as Record<string, unknown>
  }

  private root: Record<string, unknown> = {}
  private readonly declaredTables = new Set<string>()
  private readonly arrayTables = new Set<string>()
  private readonly assignedKeys = new Set<string>()

  parse(): Record<string, unknown> {
    let current = this.root
    let currentPath: string[] = []
    for (;;) {
      this.skipTrivia(true)
      if (this.eof()) return this.root
      if (this.at() === "[") {
        const array = this.at(1) === "["
        this.i += array ? 2 : 1
        const keys = this.parseKeyPath()
        if (array) {
          if (this.at() !== "]" || this.at(1) !== "]") this.fail("expected ]] to close an array of tables")
          this.i += 2
        } else {
          if (this.at() !== "]") this.fail("expected ] to close a table header")
          this.i += 1
        }
        current = this.tableAt(keys, array)
        currentPath = keys
        this.endOfLine("a table header")
        continue
      }
      const keys = this.parseKeyPath()
      this.skipSpaces()
      if (this.at() !== "=") this.fail("expected = after a key")
      this.i += 1
      this.skipSpaces()
      this.assign(current, keys, this.parseValue(), "this table")
      if (keys.length > 1) {
        for (let i = 1; i <= keys.length; i += 1) this.assignedKeys.add([...currentPath, ...keys.slice(0, i)].join("."))
      } else this.assignedKeys.add([...currentPath, keys[0]].join("."))
      this.endOfLine("a value")
    }
  }
}

function pretty(value: unknown): string {
  return JSON.stringify(
    value,
    (_k, v: unknown) => (typeof v === "number" && !Number.isFinite(v) ? (Number.isNaN(v) ? "nan" : v > 0 ? "inf" : "-inf") : v),
    2,
  )
}

function readDocument(text: string): Record<string, unknown> {
  return new TomlReader(text).parse()
}

function quoteString(value: string): string {
  let out = '"'
  for (const ch of value) {
    const code = ch.codePointAt(0) ?? 0
    if (ch === '"') out += '\\"'
    else if (ch === "\\") out += "\\\\"
    else if (ch === "\n") out += "\\n"
    else if (ch === "\r") out += "\\r"
    else if (ch === "\t") out += "\\t"
    else if (code < 0x20 || code === 0x7f) out += `\\u${code.toString(16).padStart(4, "0")}`
    else out += ch
  }
  return `${out}"`
}

function formatKey(key: string): string {
  return /^[A-Za-z0-9_-]+$/.test(key) ? key : quoteString(key)
}

function isTableArray(value: unknown): value is Array<Record<string, unknown>> {
  return Array.isArray(value) && value.length > 0 && value.every((item) => item !== null && typeof item === "object" && !Array.isArray(item))
}

function formatValue(value: unknown, path: string): string {
  if (typeof value === "string") return quoteString(value)
  if (typeof value === "boolean") return value ? "true" : "false"
  if (typeof value === "number") {
    if (!Number.isFinite(value)) throw new SourceError(`TOML has no literal for the number ${value} at ${path}`)
    if (!Number.isSafeInteger(value) && Number.isInteger(value)) throw new SourceError(`the integer at ${path} is outside the safe JavaScript range`)
    return String(value)
  }
  if (Array.isArray(value)) return `[${value.map((item) => formatValue(item, path)).join(", ")}]`
  if (value !== null && typeof value === "object") {
    const inner = Object.entries(value as Record<string, unknown>)
      .map(([k, v]) => `${formatKey(k)} = ${formatValue(v, `${path}.${k}`)}`)
      .join(", ")
    return `{ ${inner} }`
  }
  throw new SourceError(`TOML cannot store ${value === null ? "null" : typeof value} at ${path}`)
}

function emitTable(object: Record<string, unknown>, path: string[], out: string[], arrayHeader: boolean): void {
  const pairs: string[] = []
  const children: Array<[string, Record<string, unknown>]> = []
  const tables: Array<[string, Array<Record<string, unknown>>]> = []
  for (const [key, value] of Object.entries(object)) {
    if (isTableArray(value)) tables.push([key, value])
    else if (value !== null && typeof value === "object" && !Array.isArray(value)) children.push([key, value as Record<string, unknown>])
    else pairs.push(`${formatKey(key)} = ${formatValue(value, [...path, key].join("."))}`)
  }
  if (path.length) {
    const name = path.map(formatKey).join(".")
    out.push(arrayHeader ? `[[${name}]]` : `[${name}]`)
  }
  out.push(...pairs)
  if (path.length || pairs.length) out.push("")
  for (const [key, child] of children) emitTable(child, [...path, key], out, false)
  for (const [key, items] of tables) for (const item of items) emitTable(item, [...path, key], out, true)
}

function splitPath(path: string): string[] {
  const parts: string[] = []
  let i = 0
  let buffer = ""
  while (i < path.length) {
    const ch = path[i]
    if (ch === "[") {
      if (buffer.trim()) parts.push(buffer.trim())
      buffer = ""
      const end = path.indexOf("]", i)
      if (end < 0) throw new SourceError("unbalanced [ in path")
      const inner = path.slice(i + 1, end).trim().replace(/^["']|["']$/g, "")
      if (!inner) throw new SourceError("empty index in path")
      parts.push(inner)
      i = end + 1
      continue
    }
    if (ch === ".") {
      if (buffer.trim()) parts.push(buffer.trim())
      buffer = ""
      i += 1
      continue
    }
    buffer += ch
    i += 1
  }
  if (buffer.trim()) parts.push(buffer.trim())
  if (!parts.length) throw new SourceError("path is empty")
  return parts
}

export async function parseToml(a: { toml: string }): Promise<string> {
  const parsed = readDocument(a.toml)
  return `Parsed TOML to JSON:\n${pretty(parsed)}`
}

export async function toToml(a: { json: string }): Promise<string> {
  let value: unknown
  try {
    value = JSON.parse(a.json)
  } catch (e) {
    throw new SourceError(`json is not valid JSON: ${(e as Error).message}`)
  }
  if (value === null || typeof value !== "object" || Array.isArray(value)) throw new SourceError("json must be a JSON object at the top level")
  const out: string[] = []
  emitTable(value as Record<string, unknown>, [], out, false)
  const text = out.join("\n").replace(/\n{3,}/g, "\n\n").trim()
  if (!text) throw new SourceError("json produced an empty TOML document")
  return text
}

export async function getPath(a: { toml: string; path: string }): Promise<string> {
  const parsed = readDocument(a.toml)
  const parts = splitPath(a.path)
  let node: unknown = parsed
  for (const part of parts) {
    if (Array.isArray(node)) {
      if (!/^\d+$/.test(part)) throw new SourceError(`cannot use the name ${part} on an array - use [index]`)
      const index = Number(part)
      if (index >= node.length) throw new SourceError(`index ${index} is past the end of the array at ${part}`)
      node = node[index]
      continue
    }
    if (node === null || typeof node !== "object") throw new SourceError(`the path ${a.path} runs past a value at ${part}`)
    const next = (node as Record<string, unknown>)[part]
    if (next === undefined) throw new SourceError(`no key ${part} in the path ${a.path}`)
    node = next
  }
  return `${a.path} =\n${pretty(node)}`
}
